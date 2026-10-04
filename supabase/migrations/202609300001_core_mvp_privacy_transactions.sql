-- SuyoLink Core MVP Privacy, Safe Listing, Last Location, and Transactions migration
begin;

-- 1. Create request_private_details table
create table if not exists public.request_private_details (
  request_id uuid primary key references public.suyo_requests(id) on delete cascade,
  exact_address text not null check (char_length(btrim(exact_address)) between 1 and 500),
  exact_latitude double precision check (exact_latitude between -90 and 90),
  exact_longitude double precision check (exact_longitude between -180 and 180),
  contact_phone text check (char_length(btrim(contact_phone)) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Create profile_last_locations table
create table if not exists public.profile_last_locations (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  source text not null check (source in ('device','manual','cache')),
  updated_at timestamptz not null default now()
);

-- 3. Create transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.suyo_requests(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  provider_id uuid not null references public.profiles(id),
  reward_centavos integer not null check (reward_centavos between 1 and 100000000),
  currency text not null default 'PHP' check (currency = 'PHP'),
  completed_at timestamptz not null default now(),
  check (requester_id <> provider_id)
);

-- Enable RLS on newly created tables
alter table public.request_private_details enable row level security;
alter table public.profile_last_locations enable row level security;
alter table public.transactions enable row level security;

-- Revoke all by default
revoke all on public.request_private_details, public.profile_last_locations, public.transactions from public, anon, authenticated;
grant all on public.request_private_details, public.profile_last_locations, public.transactions to service_role;
grant select on public.transactions, public.profile_last_locations to authenticated;

-- Request private details: only requester or accepted provider can read. No client insert/update/delete.
create policy private_details_read on public.request_private_details for select to authenticated
using (
  exists (
    select 1 from public.suyo_requests r
    where r.id = request_private_details.request_id
      and (
        r.requester_id = (select auth.uid())
        or (r.provider_id = (select auth.uid()) and r.status in ('assigned','in_progress','awaiting_confirmation','completed'))
      )
  )
);

-- Profile last locations: only owning user can read/update/insert
create policy last_location_read on public.profile_last_locations for select to authenticated
using (user_id = (select auth.uid()));

create policy last_location_write on public.profile_last_locations for insert to authenticated
with check (user_id = (select auth.uid()));

create policy last_location_update on public.profile_last_locations for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Transactions: requester and provider can read their own transactions
create policy transactions_read on public.transactions for select to authenticated
using (requester_id = (select auth.uid()) or provider_id = (select auth.uid()));

-- 4. Backfill existing request data if any
insert into public.request_private_details(request_id, exact_address, exact_latitude, exact_longitude, contact_phone)
select
  r.id,
  coalesce(nullif(btrim(r.location), ''), 'Approximate task area'),
  r.latitude,
  r.longitude,
  nullif(substring(r.notes from 'Contact Phone: ([^\n\r]+)'), '')
from public.suyo_requests r
where not exists (select 1 from public.request_private_details d where d.request_id = r.id)
on conflict (request_id) do nothing;

-- Sanitize public suyo_requests: generic public location and rounded coordinates
update public.suyo_requests
set notes = regexp_replace(notes, '(^|[\n\r])Contact Phone: [^\n\r]*', '', 'g'),
    location = 'Approximate task area',
    latitude = case when latitude is not null then round(latitude::numeric, 2)::double precision else null end,
    longitude = case when longitude is not null then round(longitude::numeric, 2)::double precision else null end;

-- Backfill existing completed transactions
insert into public.transactions(request_id, requester_id, provider_id, reward_centavos, currency, completed_at)
select r.id, r.requester_id, r.provider_id, r.offer_centavos, r.currency, coalesce(r.completed_at, now())
from public.suyo_requests r
where r.status = 'completed' and r.provider_id is not null
on conflict (request_id) do nothing;

-- 5. RPC create_suyo_request_v2
create or replace function public.create_suyo_request_v2(
  p_title text,
  p_details text,
  p_category text,
  p_offer_centavos integer,
  p_deadline timestamptz,
  p_public_location text,
  p_exact_address text,
  p_notes text,
  p_contact_phone text,
  p_latitude double precision,
  p_longitude double precision,
  p_client_reference text
) returns public.suyo_requests
language plpgsql security definer set search_path = '' as $$
declare
  r public.suyo_requests;
  v_approx_lat double precision;
  v_approx_lng double precision;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if p_latitude is null or p_longitude is null
    or not (p_latitude between -90 and 90 and p_longitude between -180 and 180)
    then raise exception 'Choose a valid task location pin.'; end if;
  if p_client_reference is null or length(p_client_reference) not between 10 and 100
    then raise exception 'A valid request reference is required.'; end if;
  if p_public_location is null or char_length(btrim(p_public_location)) not between 1 and 250
    then raise exception 'Public area/landmark is required.'; end if;
  if p_exact_address is null or char_length(btrim(p_exact_address)) not between 1 and 500
    then raise exception 'Exact address is required.'; end if;
  if p_contact_phone is null or char_length(btrim(p_contact_phone)) not between 1 and 40
    then raise exception 'Contact phone is required.'; end if;
  if p_deadline is null or p_deadline <= now() then raise exception 'Deadline must be in the future.'; end if;
  if p_offer_centavos is null or p_offer_centavos not between 1 and 100000000
    then raise exception 'Offer must be between 1 and 100,000,000 centavos.'; end if;
  if p_category not in ('Delivery','Groceries','Documents','Queuing & Bills','Household','Other')
    then raise exception 'Invalid category.'; end if;

  -- Idempotency check
  select * into r from public.suyo_requests
    where requester_id = auth.uid() and client_reference = p_client_reference;
  if found then return r; end if;

  v_approx_lat := round(p_latitude::numeric, 2)::double precision;
  v_approx_lng := round(p_longitude::numeric, 2)::double precision;

  insert into public.suyo_requests(
    requester_id, title, details, category, offer_centavos,
    deadline, location, notes, latitude, longitude, client_reference
  ) values (
    auth.uid(), btrim(p_title), btrim(p_details), p_category, p_offer_centavos,
    p_deadline, btrim(p_public_location), btrim(coalesce(p_notes, '')),
    v_approx_lat, v_approx_lng, p_client_reference
  ) on conflict (requester_id, client_reference) do nothing returning * into r;

  if r.id is null then
    select * into r from public.suyo_requests
      where requester_id = auth.uid() and client_reference = p_client_reference;
    return r;
  end if;

  insert into public.request_private_details(
    request_id, exact_address, exact_latitude, exact_longitude, contact_phone
  ) values (
    r.id, btrim(p_exact_address), p_latitude, p_longitude, btrim(p_contact_phone)
  ) on conflict (request_id) do update set
    exact_address = excluded.exact_address,
    exact_latitude = excluded.exact_latitude,
    exact_longitude = excluded.exact_longitude,
    contact_phone = excluded.contact_phone,
    updated_at = now();

  return r;
end;
$$;

-- 6. RPC list_suyo_requests
create or replace function public.list_suyo_requests(
  p_query text default '',
  p_category text default null,
  p_status text default null,
  p_scope text default 'browse',
  p_sort text default 'newest',
  p_origin_latitude double precision default null,
  p_origin_longitude double precision default null
) returns table (
  id uuid,
  requester_id uuid,
  provider_id uuid,
  requester_name text,
  title text,
  details text,
  category text,
  offer_centavos integer,
  deadline timestamptz,
  location text,
  notes text,
  status text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km double precision
) language plpgsql stable security definer set search_path = '' as $$
begin
  return query
  select
    r.id,
    r.requester_id,
    r.provider_id,
    p.full_name as requester_name,
    r.title,
    r.details,
    r.category,
    r.offer_centavos,
    r.deadline,
    r.location,
    r.notes,
    r.status,
    r.latitude,
    r.longitude,
    r.created_at,
    r.updated_at,
    case
      when p_origin_latitude is not null and p_origin_longitude is not null and r.latitude is not null and r.longitude is not null
      then round((
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(p_origin_latitude)) * cos(radians(r.latitude)) *
            cos(radians(r.longitude) - radians(p_origin_longitude)) +
            sin(radians(p_origin_latitude)) * sin(radians(r.latitude))
          ))
        )
      )::numeric, 1)::double precision
      else null
    end as distance_km
  from public.suyo_requests r
  join public.profiles p on p.id = r.requester_id
  where
    -- Scope filtering
    (
      (p_scope = 'browse' and r.status = 'open' and r.deadline > now()) or
      (p_scope = 'posted' and r.requester_id = auth.uid()) or
      (p_scope = 'assigned' and r.provider_id = auth.uid()) or
      (p_scope = 'applied' and exists (
        select 1 from public.applications a
        where a.request_id = r.id and a.applicant_id = auth.uid()
      ))
    )
    -- Optional status override if specified
    and (p_status is null or p_status = '' or r.status = p_status)
    -- Optional category
    and (p_category is null or p_category = '' or r.category = p_category)
    -- Text query
    and (
      p_query is null or btrim(p_query) = '' or
      r.title ilike '%' || btrim(p_query) || '%' or
      r.details ilike '%' || btrim(p_query) || '%' or
      r.location ilike '%' || btrim(p_query) || '%'
    )
  order by
    case when p_sort = 'reward_desc' then r.offer_centavos end desc nulls last,
    case when p_sort = 'reward_asc' then r.offer_centavos end asc nulls last,
    case when p_sort = 'urgency' then r.deadline end asc nulls last,
    case when p_sort = 'nearest' and p_origin_latitude is not null and p_origin_longitude is not null
         then (
           6371 * acos(
             least(1.0, greatest(-1.0,
               cos(radians(p_origin_latitude)) * cos(radians(r.latitude)) *
               cos(radians(r.longitude) - radians(p_origin_longitude)) +
               sin(radians(p_origin_latitude)) * sin(radians(r.latitude))
             ))
           )
         )
    end asc nulls last,
    r.created_at desc;
end;
$$;

-- 7. RPC get_suyo_details
create or replace function public.get_suyo_details(p_request_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  r public.suyo_requests;
  p public.profiles;
  d public.request_private_details;
  v_role text := 'unrelated';
  v_can_view_private boolean := false;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into r from public.suyo_requests where id = p_request_id;
  if not found then return null; end if;

  select * into p from public.profiles where id = r.requester_id;

  if r.requester_id = auth.uid() then
    v_role := 'requester';
    v_can_view_private := true;
  elsif r.provider_id = auth.uid() and r.status in ('assigned','in_progress','awaiting_confirmation','completed') then
    v_role := 'provider';
    v_can_view_private := true;
  elsif exists (select 1 from public.applications where request_id = r.id and applicant_id = auth.uid()) then
    v_role := 'applicant';
  end if;

  if v_can_view_private then
    select * into d from public.request_private_details where request_id = r.id;
  end if;

  return jsonb_build_object(
    'id', r.id,
    'requester_id', r.requester_id,
    'provider_id', r.provider_id,
    'requester_name', p.full_name,
    'title', r.title,
    'details', r.details,
    'category', r.category,
    'offer_centavos', r.offer_centavos,
    'currency', r.currency,
    'deadline', r.deadline,
    'location', r.location,
    'notes', r.notes,
    'status', r.status,
    'latitude', r.latitude,
    'longitude', r.longitude,
    'created_at', r.created_at,
    'updated_at', r.updated_at,
    'viewer_role', v_role,
    'exact_address', case when v_can_view_private then d.exact_address else null end,
    'exact_latitude', case when v_can_view_private then d.exact_latitude else null end,
    'exact_longitude', case when v_can_view_private then d.exact_longitude else null end,
    'contact_phone', case when v_can_view_private then d.contact_phone else null end
  );
end;
$$;

-- 8. Last Location RPCs
create or replace function public.save_last_location(
  p_latitude double precision,
  p_longitude double precision,
  p_source text
) returns public.profile_last_locations
language plpgsql security definer set search_path = '' as $$
declare
  loc public.profile_last_locations;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if p_latitude is null or p_longitude is null
    or not (p_latitude between -90 and 90 and p_longitude between -180 and 180)
    then raise exception 'Invalid coordinates.'; end if;
  if p_source not in ('device','manual','cache') then raise exception 'Invalid source.'; end if;

  insert into public.profile_last_locations(user_id, latitude, longitude, source, updated_at)
  values (auth.uid(), p_latitude, p_longitude, p_source, now())
  on conflict (user_id) do update set
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    source = excluded.source,
    updated_at = now()
  returning * into loc;
  return loc;
end;
$$;

create or replace function public.get_my_last_location()
returns public.profile_last_locations
language plpgsql stable security definer set search_path = '' as $$
declare loc public.profile_last_locations;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into loc from public.profile_last_locations where user_id = auth.uid();
  return loc;
end;
$$;

-- 9. Transactions RPC
create or replace function public.get_my_transactions()
returns table (
  request_id uuid,
  title text,
  role text,
  other_user_id uuid,
  other_user_name text,
  reward_centavos integer,
  currency text,
  completed_at timestamptz,
  rating_score smallint,
  rating_comment text
) language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  return query
  select
    t.request_id,
    r.title,
    case when t.requester_id = auth.uid() then 'requester' else 'provider' end as role,
    case when t.requester_id = auth.uid() then t.provider_id else t.requester_id end as other_user_id,
    p.full_name as other_user_name,
    t.reward_centavos,
    t.currency,
    t.completed_at,
    rt.score as rating_score,
    rt.comment as rating_comment
  from public.transactions t
  join public.suyo_requests r on r.id = t.request_id
  join public.profiles p on p.id = (case when t.requester_id = auth.uid() then t.provider_id else t.requester_id end)
  left join public.ratings rt on rt.request_id = t.request_id
  where t.requester_id = auth.uid() or t.provider_id = auth.uid()
  order by t.completed_at desc;
end;
$$;

-- 10. Update review_suyo_proof to atomically insert into public.transactions upon completion
create or replace function public.review_suyo_proof(p_proof_id uuid, p_accept boolean, p_reason text default '')
returns public.suyo_requests language plpgsql security definer set search_path = '' as $$
declare
  r public.suyo_requests;
  proof public.proofs;
  v_request uuid;
begin
  if auth.uid() is null or p_accept is null then raise exception 'Sign in and choose a decision.'; end if;
  select request_id into v_request from public.proofs where id = p_proof_id;
  select * into r from public.suyo_requests where id = v_request for update;
  if not found or r.requester_id <> auth.uid() then raise exception 'Only the requester can review proof.'; end if;
  select * into proof from public.proofs where id = p_proof_id for update;

  -- Repeated confirmation is safe and does not create duplicate transaction
  if p_accept and proof.status = 'accepted' and r.status = 'completed' then
    return r;
  end if;

  if r.status <> 'awaiting_confirmation' or proof.status <> 'submitted' then
    raise exception 'This proof is not awaiting review.';
  end if;

  if not p_accept and coalesce(char_length(btrim(p_reason)),0) not between 1 and 1000 then
    raise exception 'Give a rejection reason (1-1000 characters).';
  end if;

  update public.proofs set
    status = case when p_accept then 'accepted' else 'rejected' end,
    rejection_reason = case when p_accept then null else btrim(p_reason) end,
    reviewed_at = now()
  where id = proof.id;

  update public.suyo_requests set
    status = case when p_accept then 'completed' else 'in_progress' end,
    completed_at = case when p_accept then now() else null end
  where id = r.id returning * into r;

  if p_accept then
    insert into public.transactions(request_id, requester_id, provider_id, reward_centavos, currency, completed_at)
    values (r.id, r.requester_id, r.provider_id, r.offer_centavos, r.currency, coalesce(r.completed_at, now()))
    on conflict (request_id) do nothing;
  end if;

  return r;
end;
$$;

-- 11. Manage grants for functions
revoke all on function public.create_suyo_request_v2(text,text,text,integer,timestamptz,text,text,text,text,double precision,double precision,text) from public, anon, authenticated;
grant execute on function public.create_suyo_request_v2(text,text,text,integer,timestamptz,text,text,text,text,double precision,double precision,text) to authenticated;

revoke all on function public.list_suyo_requests(text,text,text,text,text,double precision,double precision) from public, anon, authenticated;
grant execute on function public.list_suyo_requests(text,text,text,text,text,double precision,double precision) to authenticated;

revoke all on function public.get_suyo_details(uuid) from public, anon, authenticated;
grant execute on function public.get_suyo_details(uuid) to authenticated;

revoke all on function public.save_last_location(double precision,double precision,text) from public, anon, authenticated;
grant execute on function public.save_last_location(double precision,double precision,text) to authenticated;

revoke all on function public.get_my_last_location() from public, anon, authenticated;
grant execute on function public.get_my_last_location() to authenticated;

revoke all on function public.get_my_transactions() from public, anon, authenticated;
grant execute on function public.get_my_transactions() to authenticated;

commit;
