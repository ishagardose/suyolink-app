// Runs the migration against in-memory PostgreSQL (PGlite).
// Auth/Storage schemas below are test stubs, not changes for a Supabase project.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require(process.env.PGLITE_MODULE || '@electric-sql/pglite');

(async () => {
  const db = new PGlite();
  let assertions = 0;
  const ok = (value, message) => { assert.ok(value, message); assertions++; };
  async function denied(sql, message) {
    let failed = false;
    try { await db.exec(sql); } catch { failed = true; }
    ok(failed, message);
  }
  const A = '11111111-1111-4111-8111-111111111111';
  const B = '22222222-2222-4222-8222-222222222222';
  const C = '33333333-3333-4333-8333-333333333333';
  const D = '44444444-4444-4444-8444-444444444444';
  async function actor(id) {
    await db.exec("reset role; select set_config('request.jwt.claim.sub', '" + id + "', false); set role authenticated;");
  }
  const row = async (sql) => (await db.query(sql)).rows[0];
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth, storage to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id),
      name text, owner_id text, unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;
    insert into auth.users values ('${A}', '{"full_name":"Requester"}');
  `);
  await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/202609260001_initial_schema.sql'), 'utf8'));
  ok((await row('select count(*)::int as count from public.profiles')).count === 1, 'Existing auth user is backfilled');
  await db.exec(`insert into auth.users values ('${B}', '{"full_name":"Provider"}'), ('${C}', '{"full_name":"Other"}'), ('${D}', '{}');`);
  ok((await row('select count(*)::int as count from public.profile_contacts')).count === 4, 'New user trigger creates profile and contacts');
  await actor(A);
  await db.exec("update public.profile_contacts set phone = 'private-phone';");
  await actor(B);
  ok((await row("select count(*)::int as count from public.profile_contacts where phone='private-phone'")).count === 0, 'Contacts remain private');
  await denied(`update public.profiles set id='${A}' where id='${B}'`, 'Cannot change own ID');
  await db.exec("update public.profiles set full_name='Provider updated' where id='" + B + "';");
  await denied("insert into public.points_ledger(user_id,request_id,points) values ('" + B + "',gen_random_uuid(),10)", 'Cannot award own points');

  await actor(A);
  await denied("select public.create_suyo_request('x','x','Other',0,now()+interval '1 day','City','')", 'Zero offers rejected');
  await denied("select public.create_suyo_request('x','x','Other',100,now()-interval '1 day','City','')", 'Past deadlines rejected');
  const r = await row("select * from public.create_suyo_request('Groceries','Rice and eggs','Groceries',15025,now()+interval '1 day','City market','')");
  ok(r.requester_id === A && r.status === 'open', 'Creation uses caller identity and Open status');
  await denied(`update public.suyo_requests set status='completed' where id='${r.id}'`, 'Direct status updates blocked');
  await denied(`select public.apply_to_suyo('${r.id}','')`, 'No self-applications');
  await denied(`select public.change_suyo_status('${r.id}','completed')`, 'Cannot skip completion flow');
  await actor(B);
  const b = await row(`select * from public.apply_to_suyo('${r.id}','Ready')`);
  await denied(`select public.apply_to_suyo('${r.id}','Again')`, 'Duplicate applications rejected');
  await denied(`select public.decide_application('${b.id}',true)`, 'Applicants cannot approve themselves');
  await denied(`select public.rate_suyo_provider('${r.id}',5::smallint,'')`, 'Cannot rate unfinished work');
  await actor(C);
  const c = await row(`select * from public.apply_to_suyo('${r.id}','Also ready')`);
  await actor(A);
  await db.exec(`select public.decide_application('${b.id}',true)`);
  ok((await row(`select status from public.applications where id='${c.id}'`)).status === 'rejected', 'Other applicants closed');
  await denied(`select public.decide_application('${c.id}',true)`, 'Second provider approval rejected');
  await actor(D);
  ok((await row(`select count(*)::int as count from public.suyo_requests where id='${r.id}'`)).count === 0, 'Unrelated user cannot read assigned task');
  ok((await row('select count(*)::int as count from public.notifications')).count === 0, 'Unrelated user cannot read notifications');
  await actor(C);
  await denied(`select public.change_suyo_status('${r.id}','in_progress')`, 'Non-provider cannot start work');
  await actor(B);
  await db.exec(`select public.change_suyo_status('${r.id}','in_progress')`);
  await denied(`select public.submit_suyo_proof('${r.id}','${r.id}/${B}/missing.jpg','')`, 'Missing upload rejected');
  const object1 = r.id + '/' + B + '/proof.jpg';
  await db.exec(`insert into storage.objects(bucket_id,name,owner_id) values ('suyo-proofs','${object1}','${B}')`);
  const proof = await row(`select * from public.submit_suyo_proof('${r.id}','${object1}','Delivered')`);
  await db.exec(`delete from storage.objects where name='${object1}'`);
  ok((await row(`select count(*)::int as count from storage.objects where name='${object1}'`)).count === 1, 'Evidence cannot be deleted');
  await denied(`select public.review_suyo_proof('${proof.id}',true,'')`, 'Provider cannot confirm own completion');
  await actor(C);
  ok((await row('select count(*)::int as count from public.proofs')).count === 0, 'Other applicant cannot read proof metadata');
  ok((await row('select count(*)::int as count from storage.objects')).count === 0, 'Other applicant cannot read images');
  await denied(`insert into storage.objects(bucket_id,name,owner_id) values ('suyo-proofs','${r.id}/${C}/bad.jpg','${C}')`, 'Other applicant cannot upload');
  await actor(A);
  await denied(`select public.review_suyo_proof('${proof.id}',false,'')`, 'Rejection needs a reason');
  await db.exec(`select public.review_suyo_proof('${proof.id}',false,'Need a clearer photo')`);
  ok((await row(`select status from public.suyo_requests where id='${r.id}'`)).status === 'in_progress', 'Rejected proof returns to in progress');
  await actor(B);
  const object2 = r.id + '/' + B + '/clear.jpg';
  await db.exec(`insert into storage.objects(bucket_id,name,owner_id) values ('suyo-proofs','${object2}','${B}')`);
  const proof2 = await row(`select * from public.submit_suyo_proof('${r.id}','${object2}','Clearer')`);
  await actor(A);
  await db.exec(`select public.review_suyo_proof('${proof2.id}',true,''); select public.review_suyo_proof('${proof2.id}',true,'');`);
  ok((await row(`select status from public.suyo_requests where id='${r.id}'`)).status === 'completed', 'Requester confirms completion');
  await db.exec(`select public.rate_suyo_provider('${r.id}',5::smallint,'Great');`);
  await denied(`select public.rate_suyo_provider('${r.id}',1::smallint,'Again')`, 'Only one rating per request');
  await actor(B);
  ok(Number((await row('select total_points from public.my_points')).total_points) === 10, 'Repeated confirmation awards exactly 10 points');
  ok(Number((await row('select average_rating from public.provider_ratings')).average_rating) === 5, 'Average comes from actual ratings');
  ok((await row(`select count(*)::int as count from public.request_events where request_id='${r.id}'`)).count === 7, 'Append-only status history recorded');
  await denied(`update public.notifications set recipient_id='${B}'`, 'Cannot change notification recipients');
  await db.exec('update public.notifications set read_at=now()');
  ok((await row('select count(*)::int as count from public.notifications where read_at is null')).count === 0, 'Recipient can mark own notifications read');

  await actor(A);
  const cancelled = await row("select * from public.create_suyo_request('Cancel me','Details','Other',100,now()+interval '1 day','City','')");
  await actor(B);
  await db.exec(`select public.apply_to_suyo('${cancelled.id}','')`);
  await actor(A);
  await db.exec(`select public.change_suyo_status('${cancelled.id}','cancelled')`);
  ok((await row(`select status from public.applications where request_id='${cancelled.id}'`)).status === 'rejected', 'Cancellation closes applications');
  await db.exec("reset role; select set_config('request.jwt.claim.sub','',false); set role anon;");
  await denied('select * from public.profiles', 'Anonymous profile access denied');
  await denied("select public.create_suyo_request('x','x','Other',100,now()+interval '1 day','City','')", 'Anonymous RPC access denied');
  await db.exec('reset role');
  await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/202609260002_request_locations.sql'), 'utf8'));
  await actor(A);
  const locationCall = "select * from public.create_suyo_request_at_location('Pinned request','Details','Other',100,now()+interval '1 day','Market','',7.07,125.6,'retry-reference-001')";
  const pinned = await row(locationCall);
  ok(pinned.requester_id === A && pinned.latitude === 7.07 && pinned.longitude === 125.6, 'Pin saved with authenticated ownership');
  ok((await row(locationCall)).id === pinned.id, 'Retry is idempotent');
  await denied(locationCall.replace('7.07,125.6', '91,125.6'), 'Out-of-range coordinate rejected');
  await denied(locationCall.replace('7.07,125.6', "'NaN'::float8,125.6"), 'NaN rejected');
  await denied(locationCall.replace('7.07,125.6', 'null,125.6'), 'Missing latitude rejected');
  await actor(B);
  ok((await row(`select latitude from public.suyo_requests where id='${pinned.id}'`)).latitude === 7.07, 'Another user can discover open request pins');
  await denied(`update public.suyo_requests set latitude=1 where id='${pinned.id}'`, 'Cannot alter another request location');
  ok((await row(locationCall)).id !== pinned.id, 'Retry keys are scoped to their requester');
  await db.exec("reset role; select set_config('request.jwt.claim.sub','',false); set role anon;");
  await denied(locationCall, 'Anonymous pinned requests denied');
  await db.exec('reset role');
  await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/202609270001_defer_points.sql'), 'utf8'));
  await actor(A);
  const deferred = await row("select * from public.create_suyo_request('No points','Details','Other',100,now()+interval '1 day','City','')");
  await actor(B);
  const deferredApplication = await row(`select * from public.apply_to_suyo('${deferred.id}','')`);
  await actor(A);
  await db.exec(`select public.decide_application('${deferredApplication.id}',true)`);
  await actor(B);
  await db.exec(`select public.change_suyo_status('${deferred.id}','in_progress')`);
  const deferredPath = `${deferred.id}/${B}/proof.png`;
  await db.exec(`insert into storage.objects(bucket_id,name,owner_id) values ('suyo-proofs','${deferredPath}','${B}')`);
  const deferredProof = await row(`select * from public.submit_suyo_proof('${deferred.id}','${deferredPath}','')`);
  await actor(A);
  await db.exec(`select public.review_suyo_proof('${deferredProof.id}',true,'')`);
  await actor(B);
  ok((await row(`select count(*)::int as count from public.points_ledger where request_id='${deferred.id}'`)).count === 0, 'Deferred points migration stops new awards');
  ok(Number((await row('select total_points from public.my_points')).total_points) === 10, 'Previously awarded points are preserved');
  ok((await row(`select count(*)::int as count from public.notifications where request_id='${deferred.id}' and kind='completed'`)).count === 1, 'Completion still notifies provider');
  await db.exec('reset role');

  // Load new Task 1 migration
  await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/202609300001_core_mvp_privacy_transactions.sql'), 'utf8'));

  // 1. Check legacy table data migration: public location reset and coordinates rounded to 2 decimals
  const legacyReq = await row(`select location, latitude, longitude from public.suyo_requests where id='${pinned.id}'`);
  ok(legacyReq.location === 'Approximate task area', 'Legacy public location replaced with safe generic area');
  ok(legacyReq.latitude === 7.07 && legacyReq.longitude === 125.6, 'Coordinates rounded to 2 decimal places');

  // 2. Direct authenticated select on suyo_requests is revoked or restricted, and request_private_details cannot be read directly
  await actor(D);
  await denied(`select * from public.request_private_details`, 'Direct reads of private details denied');
  await denied(`select exact_address, contact_phone from public.suyo_requests`, 'Exact columns cannot be read on suyo_requests');

  // 3. create_suyo_request_v2 creates request and private details atomically
  await actor(A);
  const v2Call = `select * from public.create_suyo_request_v2(
    'Deliver groceries', 'Apples and bananas', 'Groceries', 25000,
    now() + interval '2 hours', 'Davao City', '123 Private St, Apt 4B', 'Ring bell twice',
    '+639171234567', 7.073456, 125.612345, 'client-ref-v2-001'
  )`;
  const v2Req = await row(v2Call);
  ok(v2Req.requester_id === A && v2Req.status === 'open', 'v2 request created with open status');
  ok(v2Req.latitude === 7.07 && v2Req.longitude === 125.61, 'Approximate coordinates rounded to 2 decimal places on public row');
  ok(v2Req.location === 'Davao City', 'Public location stored as area label');

  // Idempotency: repeated client reference returns existing request without duplicate
  const v2Retry = await row(v2Call);
  ok(v2Retry.id === v2Req.id, 'Repeated client reference is idempotent');

  // 4. get_suyo_details role-based visibility
  // Unrelated user (D) gets null private fields
  await actor(D);
  const detailsUnrelated = (await row(`select public.get_suyo_details('${v2Req.id}') as d`)).d;
  ok(detailsUnrelated.title === 'Deliver groceries', 'Unrelated user sees public title');
  ok(detailsUnrelated.exact_address === null, 'Unrelated user cannot see exact address');
  ok(detailsUnrelated.exact_latitude === null, 'Unrelated user cannot see exact latitude');
  ok(detailsUnrelated.contact_phone === null, 'Unrelated user cannot see contact phone');

  // Provider B applies
  await actor(B);
  const v2App = await row(`select * from public.apply_to_suyo('${v2Req.id}', 'I can deliver')`);
  // Applicant gets null private fields before acceptance
  const detailsApplicant = (await row(`select public.get_suyo_details('${v2Req.id}') as d`)).d;
  ok(detailsApplicant.exact_address === null, 'Applicant cannot see exact address');
  ok(detailsApplicant.contact_phone === null, 'Applicant cannot see contact phone');

  // Requester A sees exact details
  await actor(A);
  const detailsRequester = (await row(`select public.get_suyo_details('${v2Req.id}') as d`)).d;
  ok(detailsRequester.viewer_role === 'requester', 'Requester role identified');
  ok(detailsRequester.exact_address === '123 Private St, Apt 4B', 'Requester sees exact address');
  ok(detailsRequester.contact_phone === '+639171234567', 'Requester sees contact phone');

  // Requester A accepts provider B
  await db.exec(`select public.decide_application('${v2App.id}', true)`);

  // Provider B is now accepted and sees exact details
  await actor(B);
  const detailsAccepted = (await row(`select public.get_suyo_details('${v2Req.id}') as d`)).d;
  ok(detailsAccepted.viewer_role === 'provider', 'Accepted provider role identified');
  ok(detailsAccepted.exact_address === '123 Private St, Apt 4B', 'Accepted provider sees exact address');
  ok(detailsAccepted.exact_latitude === 7.073456, 'Accepted provider sees exact latitude');
  ok(detailsAccepted.exact_longitude === 125.612345, 'Accepted provider sees exact longitude');
  ok(detailsAccepted.contact_phone === '+639171234567', 'Accepted provider sees contact phone');

  // 5. list_suyo_requests safe listing and sorting
  const listBrowse = (await db.query(`select * from public.list_suyo_requests('', null, null, 'browse', 'newest', null, null)`)).rows;
  ok(listBrowse.length > 0, 'list_suyo_requests returns public items');
  ok(listBrowse.every(item => item.exact_address === undefined), 'Listing does not expose exact_address');

  // 6. Last location saving and reading: only owner can access
  await actor(A);
  const savedLoc = await row(`select * from public.save_last_location(7.08, 125.62, 'manual')`);
  ok(savedLoc.user_id === A && savedLoc.latitude === 7.08 && savedLoc.source === 'manual', 'Owner saves last location');
  const myLoc = await row(`select * from public.get_my_last_location()`);
  ok(myLoc.latitude === 7.08, 'Owner retrieves last location');

  await actor(B);
  const bLoc = await row(`select * from public.get_my_last_location()`);
  ok(!bLoc || bLoc.latitude === null, 'Other user cannot see another user last location');
  ok((await row(`select count(*)::int as count from public.profile_last_locations where user_id='${A}'`)).count === 0, 'Cannot read another user last location via RLS');

  // 7. Workflow progression to completion and transaction creation
  await actor(B);
  await db.exec(`select public.change_suyo_status('${v2Req.id}', 'in_progress')`);
  const v2ProofPath = `${v2Req.id}/${B}/v2proof.jpg`;
  await db.exec(`insert into storage.objects(bucket_id,name,owner_id) values ('suyo-proofs','${v2ProofPath}','${B}')`);
  const v2Proof = await row(`select * from public.submit_suyo_proof('${v2Req.id}', '${v2ProofPath}', 'Done')`);

  await actor(A);
  await db.exec(`select public.review_suyo_proof('${v2Proof.id}', true, '')`);
  // Repeated confirmation is idempotent
  await db.exec(`select public.review_suyo_proof('${v2Proof.id}', true, '')`);

  // Assert transaction row created
  const txRows = (await db.query(`select * from public.transactions where request_id='${v2Req.id}'`)).rows;
  ok(txRows.length === 1, 'Exactly one transaction created upon completion');
  ok(txRows[0].requester_id === A && txRows[0].provider_id === B && txRows[0].reward_centavos === 25000, 'Transaction has correct amounts and parties');

  // Both users see transactions via get_my_transactions
  await actor(A);
  const aTxs = (await db.query(`select * from public.get_my_transactions()`)).rows;
  ok(aTxs.some(t => t.request_id === v2Req.id && t.role === 'requester'), 'Requester sees completed transaction');

  await actor(B);
  const bTxs = (await db.query(`select * from public.get_my_transactions()`)).rows;
  ok(bTxs.some(t => t.request_id === v2Req.id && t.role === 'provider'), 'Provider sees completed transaction');

  await db.close();
  console.log('PASS: migration + ' + assertions + ' workflow, RLS, storage-policy, and integrity checks.');
})().catch((error) => { console.error(error.message); process.exitCode = 1; });

