-- SuyoLink initial schema. Run ONCE on a fresh Supabase application schema.
-- Uses existing Supabase auth/storage schemas. Does not drop or replace existing tables.
-- Entire migration rolls back on error. Account/request screens still need API wiring.
begin;

create schema if not exists suyo_private;
revoke all on schema suyo_private from public, anon;
grant usage on schema suyo_private to authenticated;

-- Public marketplace identity. Email/password/verification remain in Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Personal contact details are never exposed to other marketplace users.
create table public.profile_contacts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone text not null default '' check (char_length(phone) <= 40),
  address text not null default '' check (char_length(address) <= 250),
  updated_at timestamptz not null default now()
);

create table public.suyo_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id),
  provider_id uuid references public.profiles(id),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  details text not null check (char_length(btrim(details)) between 1 and 2000),
  category text not null check (category in ('Delivery','Groceries','Documents','Household','Other')),
  offer_centavos integer not null check (offer_centavos between 1 and 100000000),
  currency text not null default 'PHP' check (currency = 'PHP'),
  deadline timestamptz not null,
  location text not null check (char_length(btrim(location)) between 1 and 250),
  notes text not null default '' check (char_length(notes) <= 1000),
  status text not null default 'open'
    check (status in ('open','assigned','in_progress','awaiting_confirmation','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (provider_id is null or provider_id <> requester_id),
  check ((status in ('open','cancelled') and provider_id is null)
      or (status in ('assigned','in_progress','awaiting_confirmation','completed') and provider_id is not null)),
  check ((status = 'completed') = (completed_at is not null))
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.suyo_requests(id),
  applicant_id uuid not null references public.profiles(id),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (request_id, applicant_id)
);
create unique index one_accepted_application on public.applications(request_id) where status = 'accepted';

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.suyo_requests(id),
  provider_id uuid not null references public.profiles(id),
  storage_path text not null unique check (char_length(storage_path) between 1 and 500),
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'submitted' check (status in ('submitted','accepted','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (status <> 'rejected' or char_length(btrim(rejection_reason)) > 0)
);
create unique index one_pending_proof on public.proofs(request_id) where status = 'submitted';

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.suyo_requests(id),
  reviewer_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  score smallint not null check (score between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  check (reviewer_id <> provider_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid references public.suyo_requests(id),
  kind text not null check (kind in ('application','application_decision','status_update','completed')),
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Append-only task history, not a record of money transfers.
create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.suyo_requests(id),
  actor_id uuid references public.profiles(id),
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);

-- A unique request_id prevents a second reward for the same completion.
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  request_id uuid not null unique references public.suyo_requests(id),
  points integer not null check (points = 10),
  reason text not null default 'confirmed_completion' check (reason = 'confirmed_completion'),
  created_at timestamptz not null default now()
);

create index requests_requester_idx on public.suyo_requests(requester_id, created_at desc);
create index requests_provider_idx on public.suyo_requests(provider_id, created_at desc);
create index requests_browse_idx on public.suyo_requests(status, category, deadline);
create index requests_offer_idx on public.suyo_requests(offer_centavos) where status = 'open';
create index applications_applicant_idx on public.applications(applicant_id);
create index proofs_request_idx on public.proofs(request_id);
create index proofs_provider_idx on public.proofs(provider_id);
create index ratings_provider_idx on public.ratings(provider_id);
create index notifications_recipient_idx on public.notifications(recipient_id, created_at desc);
create index events_request_idx on public.request_events(request_id, created_at);
create index points_user_idx on public.points_ledger(user_id);

create function suyo_private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger profiles_updated before update on public.profiles
for each row execute function suyo_private.touch_updated_at();
create trigger contacts_updated before update on public.profile_contacts
for each row execute function suyo_private.touch_updated_at();
create trigger requests_updated before update on public.suyo_requests
for each row execute function suyo_private.touch_updated_at();

create function suyo_private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name)
  values (new.id, left(coalesce(nullif(btrim(new.raw_user_meta_data->>'full_name'), ''), 'SuyoLink user'), 100));
  insert into public.profile_contacts(user_id) values (new.id);
  return new;
end;
$$;
create trigger suyo_auth_user_created after insert on auth.users
for each row execute function suyo_private.handle_new_user();

-- Include users who signed up before this migration.
insert into public.profiles(id, full_name)
select id, left(coalesce(nullif(btrim(raw_user_meta_data->>'full_name'), ''), 'SuyoLink user'), 100)
from auth.users on conflict (id) do nothing;
insert into public.profile_contacts(user_id)
select id from public.profiles on conflict (user_id) do nothing;

-- Definer helpers avoid circular RLS between requests and applications.
-- Their result is always scoped to the current authenticated caller.
create function suyo_private.can_view_request(p_request_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.suyo_requests r where r.id = p_request_id and (
      r.status = 'open' or auth.uid() in (r.requester_id, r.provider_id)
      or exists (select 1 from public.applications a where a.request_id = r.id and a.applicant_id = auth.uid())
    )
  );
$$;
create function suyo_private.is_requester(p_request_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.suyo_requests where id = p_request_id and requester_id = auth.uid());
$$;
create function suyo_private.is_participant(p_request_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.suyo_requests where id = p_request_id and auth.uid() in (requester_id, provider_id));
$$;

-- Status changes generate history, in-app notifications, and completion rewards atomically.
create function suyo_private.record_request_event() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_from text;
begin
  if tg_op = 'UPDATE' then
    if new.status = old.status then return new; end if;
    v_from := old.status;
  end if;
  insert into public.request_events(request_id, actor_id, from_status, to_status)
  values (new.id, auth.uid(), v_from, new.status);
  if tg_op = 'UPDATE' then
    insert into public.notifications(recipient_id, request_id, kind, body)
    select recipient, new.id,
      case when new.status = 'completed' then 'completed' else 'status_update' end,
      'Request "' || new.title || '" is now ' || replace(new.status, '_', ' ') || '.'
    from (select new.requester_id as recipient union select new.provider_id) recipients
    where recipient is not null and recipient is distinct from auth.uid();
  end if;
  if new.status = 'completed' then
    insert into public.points_ledger(user_id, request_id, points)
    values (new.provider_id, new.id, 10) on conflict (request_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger request_event_created after insert or update of status on public.suyo_requests
for each row execute function suyo_private.record_request_event();

-- Read policies + explicit column grants. Workflow tables have NO client write policies.
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.suyo_requests enable row level security;
alter table public.applications enable row level security;
alter table public.proofs enable row level security;
alter table public.ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.request_events enable row level security;
alter table public.points_ledger enable row level security;

revoke all on public.profiles, public.profile_contacts, public.suyo_requests,
  public.applications, public.proofs, public.ratings, public.notifications,
  public.request_events, public.points_ledger from public, anon, authenticated;
grant select on public.profiles, public.profile_contacts, public.suyo_requests,
  public.applications, public.proofs, public.ratings, public.notifications,
  public.request_events, public.points_ledger to authenticated;
grant all on public.profiles, public.profile_contacts, public.suyo_requests,
  public.applications, public.proofs, public.ratings, public.notifications,
  public.request_events, public.points_ledger to service_role;
grant update (full_name) on public.profiles to authenticated;
grant update (phone, address) on public.profile_contacts to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_edit on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy contacts_read on public.profile_contacts for select to authenticated using (user_id = (select auth.uid()));
create policy contacts_edit on public.profile_contacts for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy requests_read on public.suyo_requests for select to authenticated using (suyo_private.can_view_request(id));
create policy applications_read on public.applications for select to authenticated
using (applicant_id = (select auth.uid()) or suyo_private.is_requester(request_id));
create policy proofs_read on public.proofs for select to authenticated using (suyo_private.is_participant(request_id));
create policy ratings_read on public.ratings for select to authenticated using (true);
create policy notifications_read on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
create policy notifications_mark_read on public.notifications for update to authenticated
using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy events_read on public.request_events for select to authenticated using (suyo_private.is_participant(request_id));
create policy points_read on public.points_ledger for select to authenticated using (user_id = (select auth.uid()));

-- Client RPCs: the actor always comes from auth.uid(), never a supplied user ID.
create function public.create_suyo_request(
  p_title text, p_details text, p_category text, p_offer_centavos integer,
  p_deadline timestamptz, p_location text, p_notes text default ''
) returns public.suyo_requests
language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if p_deadline is null or p_deadline <= now() then raise exception 'Deadline must be in the future.'; end if;
  insert into public.suyo_requests(requester_id, title, details, category, offer_centavos, deadline, location, notes)
  values (auth.uid(), btrim(p_title), btrim(p_details), p_category, p_offer_centavos, p_deadline, btrim(p_location), btrim(coalesce(p_notes,'')))
  returning * into r;
  return r;
end;
$$;

create function public.apply_to_suyo(p_request_id uuid, p_message text default '')
returns public.applications language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests; a public.applications;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if not found or r.status <> 'open' or r.deadline <= now() then raise exception 'This request is not accepting applications.'; end if;
  if r.requester_id = auth.uid() then raise exception 'You cannot apply to your own request.'; end if;
  insert into public.applications(request_id, applicant_id, message)
  values (r.id, auth.uid(), btrim(coalesce(p_message,''))) returning * into a;
  insert into public.notifications(recipient_id, request_id, kind, body)
  values (r.requester_id, r.id, 'application', 'A provider applied to "' || r.title || '".');
  return a;
end;
$$;

create function public.decide_application(p_application_id uuid, p_accept boolean)
returns public.applications language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests; a public.applications; v_request uuid;
begin
  if auth.uid() is null or p_accept is null then raise exception 'Sign in and choose a decision.'; end if;
  select request_id into v_request from public.applications where id = p_application_id;
  select * into r from public.suyo_requests where id = v_request for update;
  if not found or r.requester_id <> auth.uid() then raise exception 'Only the requester can decide.'; end if;
  select * into a from public.applications where id = p_application_id for update;
  if r.status <> 'open' or r.deadline <= now() or a.status <> 'pending' then raise exception 'Application is no longer eligible.'; end if;
  update public.applications set status = case when p_accept then 'accepted' else 'rejected' end, decided_at = now()
  where id = a.id returning * into a;
  insert into public.notifications(recipient_id, request_id, kind, body)
  values (a.applicant_id, r.id, 'application_decision', 'Your application was ' || a.status || '.');
  if p_accept then
    insert into public.notifications(recipient_id, request_id, kind, body)
    select applicant_id, r.id, 'application_decision', 'Another provider was selected.'
    from public.applications where request_id = r.id and status = 'pending';
    update public.applications set status = 'rejected', decided_at = now() where request_id = r.id and status = 'pending';
    update public.suyo_requests set provider_id = a.applicant_id, status = 'assigned' where id = r.id;
  end if;
  return a;
end;
$$;

create function public.withdraw_application(p_application_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests; a public.applications; v_request uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select request_id into v_request from public.applications where id = p_application_id;
  select * into r from public.suyo_requests where id = v_request for update;
  select * into a from public.applications where id = p_application_id for update;
  if not found or a.applicant_id <> auth.uid() or a.status <> 'pending' then raise exception 'Cannot withdraw this application.'; end if;
  update public.applications set status = 'withdrawn', decided_at = now() where id = a.id;
end;
$$;

-- Only two direct transitions; completion must pass through proof review.
create function public.change_suyo_status(p_request_id uuid, p_status text)
returns public.suyo_requests language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if not found then raise exception 'Request not found.'; end if;
  if p_status = 'cancelled' and r.status = 'open' and r.requester_id = auth.uid() then
    insert into public.notifications(recipient_id, request_id, kind, body)
    select applicant_id, r.id, 'status_update', 'The requester cancelled this suyo.'
    from public.applications where request_id = r.id and status = 'pending';
    update public.applications set status = 'rejected', decided_at = now() where request_id = r.id and status = 'pending';
  elsif p_status = 'in_progress' and r.status = 'assigned' and r.provider_id = auth.uid() then
    null;
  else raise exception 'This status change is not allowed.';
  end if;
  update public.suyo_requests set status = p_status where id = r.id returning * into r;
  return r;
end;
$$;

-- Private images: upload first, then submit the returned object path.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('suyo-proofs', 'suyo-proofs', false, 10485760, array['image/jpeg','image/png','image/webp']);

create function suyo_private.can_upload_proof(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and split_part(p_path, '/', 2) = auth.uid()::text
    and split_part(p_path, '/', 3) <> ''
    and exists (select 1 from public.suyo_requests r
      where r.id::text = split_part(p_path, '/', 1) and r.provider_id = auth.uid() and r.status = 'in_progress');
$$;
create function suyo_private.can_read_proof(p_path text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.suyo_requests r
    where r.id::text = split_part(p_path, '/', 1) and auth.uid() in (r.requester_id, r.provider_id));
$$;
create policy suyo_proofs_upload on storage.objects for insert to authenticated
with check (bucket_id = 'suyo-proofs' and suyo_private.can_upload_proof(name));
create policy suyo_proofs_read on storage.objects for select to authenticated
using (bucket_id = 'suyo-proofs' and suyo_private.can_read_proof(name));
-- No client UPDATE/DELETE policy: submitted evidence cannot be replaced or removed.

create function public.submit_suyo_proof(p_request_id uuid, p_storage_path text, p_note text default '')
returns public.proofs language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests; proof public.proofs;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if not found or r.provider_id is distinct from auth.uid() or r.status <> 'in_progress' then raise exception 'Only the assigned provider can submit proof during work.'; end if;
  if split_part(p_storage_path, '/', 1) <> r.id::text
    or split_part(p_storage_path, '/', 2) <> auth.uid()::text
    or not exists (select 1 from storage.objects where bucket_id = 'suyo-proofs' and name = p_storage_path and owner_id = auth.uid()::text)
  then raise exception 'Upload your proof image to the correct request folder first.'; end if;
  insert into public.proofs(request_id, provider_id, storage_path, note)
  values (r.id, auth.uid(), p_storage_path, btrim(coalesce(p_note,''))) returning * into proof;
  update public.suyo_requests set status = 'awaiting_confirmation' where id = r.id;
  return proof;
end;
$$;

create function public.review_suyo_proof(p_proof_id uuid, p_accept boolean, p_reason text default '')
returns public.suyo_requests language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests; proof public.proofs; v_request uuid;
begin
  if auth.uid() is null or p_accept is null then raise exception 'Sign in and choose a decision.'; end if;
  select request_id into v_request from public.proofs where id = p_proof_id;
  select * into r from public.suyo_requests where id = v_request for update;
  if not found or r.requester_id <> auth.uid() then raise exception 'Only the requester can review proof.'; end if;
  select * into proof from public.proofs where id = p_proof_id for update;
  -- Repeated confirmation is safe and does not issue another points reward.
  if p_accept and proof.status = 'accepted' and r.status = 'completed' then return r; end if;
  if r.status <> 'awaiting_confirmation' or proof.status <> 'submitted' then raise exception 'This proof is not awaiting review.'; end if;
  if not p_accept and coalesce(char_length(btrim(p_reason)),0) not between 1 and 1000 then raise exception 'Give a rejection reason (1-1000 characters).'; end if;
  update public.proofs set status = case when p_accept then 'accepted' else 'rejected' end,
    rejection_reason = case when p_accept then null else btrim(p_reason) end, reviewed_at = now()
  where id = proof.id;
  update public.suyo_requests set status = case when p_accept then 'completed' else 'in_progress' end,
    completed_at = case when p_accept then now() else null end
  where id = r.id returning * into r;
  return r;
end;
$$;

create function public.rate_suyo_provider(p_request_id uuid, p_score smallint, p_comment text default '')
returns public.ratings language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests; rating public.ratings;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if not found or r.requester_id <> auth.uid() or r.status <> 'completed' then raise exception 'Only the requester can rate a completed suyo.'; end if;
  insert into public.ratings(request_id, reviewer_id, provider_id, score, comment)
  values (r.id, auth.uid(), r.provider_id, p_score, btrim(coalesce(p_comment,''))) returning * into rating;
  return rating;
end;
$$;

-- Aggregate actual ratings/rewards; users cannot edit totals.
create view public.provider_ratings with (security_invoker = true) as
select provider_id, count(*) as rating_count, round(avg(score),2) as average_rating
from public.ratings group by provider_id;
create view public.my_points with (security_invoker = true) as
select (select auth.uid()) as user_id, coalesce(sum(points),0)::bigint as total_points
from public.points_ledger where user_id = (select auth.uid());
revoke all on public.provider_ratings, public.my_points from public, anon, authenticated;
grant select on public.provider_ratings, public.my_points to authenticated;

-- Functions have PUBLIC execute by default: remove it for every function created here.
revoke all on all functions in schema suyo_private from public, anon, authenticated;
grant execute on function suyo_private.can_view_request(uuid), suyo_private.is_requester(uuid),
  suyo_private.is_participant(uuid), suyo_private.can_upload_proof(text), suyo_private.can_read_proof(text)
  to authenticated;
revoke all on function public.create_suyo_request(text,text,text,integer,timestamptz,text,text),
  public.apply_to_suyo(uuid,text), public.decide_application(uuid,boolean),
  public.withdraw_application(uuid), public.change_suyo_status(uuid,text),
  public.submit_suyo_proof(uuid,text,text), public.review_suyo_proof(uuid,boolean,text),
  public.rate_suyo_provider(uuid,smallint,text) from public, anon, authenticated;
grant execute on function public.create_suyo_request(text,text,text,integer,timestamptz,text,text),
  public.apply_to_suyo(uuid,text), public.decide_application(uuid,boolean),
  public.withdraw_application(uuid), public.change_suyo_status(uuid,text),
  public.submit_suyo_proof(uuid,text,text), public.review_suyo_proof(uuid,boolean,text),
  public.rate_suyo_provider(uuid,smallint,text) to authenticated;

commit;
