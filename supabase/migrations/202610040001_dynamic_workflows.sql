-- Apply after 202609300001. Persist matching, reciprocal reviews, and foreground tracking.
begin;
alter table public.suyo_requests drop constraint suyo_requests_category_check;
alter table public.suyo_requests
add constraint suyo_requests_category_check
  check (
    category in (
      'Delivery',
      'Groceries',
      'Documents',
      'Queuing & Bills',
      'Household',
      'Other'
    )
  );
-- Support installations that already ran the older core migration.
alter table public.request_private_details
alter column exact_latitude drop not null;
alter table public.request_private_details
alter column exact_longitude drop not null;
alter table public.request_private_details
alter column contact_phone drop not null;
/* sql-parser-cst-disable */
update public.request_private_details d
set contact_phone =nullif(substring(r.notes from 'Contact Phone: ([^\n\r]+)'), '')
from public.suyo_requests r
where r.id = d.request_id
  and r.notes like 'Contact Phone: %'
  and (d.contact_phone is null or d.contact_phone = 'N/A');
/* sql-parser-cst-enable */
update public.suyo_requests
set notes = regexp_replace(notes, '(^|[\n\r])Contact Phone: [^\n\r]*', '', 'g')
where notes like '%Contact Phone: %';
-- Retain the accepted provider on cancelled work for the audit trail.
alter table public.suyo_requests drop constraint suyo_requests_check1;
alter table public.suyo_requests
add constraint suyo_requests_assignment_check
  check (
    (status = 'open' and provider_id is null)
    or status = 'cancelled'
    or (
      status in (
        'assigned',
        'in_progress',
        'awaiting_confirmation',
        'completed'
      )
      and provider_id is not null
    )
  );
revoke execute
on function public.create_suyo_request(
  text,
  text,
  text,
  integer,
  timestamptz,
  text,
  text
)
from public, anon, authenticated;
revoke execute
on function public.create_suyo_request_at_location(
  text,
  text,
  text,
  integer,
  timestamptz,
  text,
  text,
  double precision,
  double precision,
  text
)
from public, anon, authenticated;

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
)
returns public.suyo_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.suyo_requests;
  v_approx_lat double precision;
  v_approx_lng double precision;
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;
  if
    p_latitude is null
    or p_longitude is null
    or not (p_latitude between -90 and 90 and p_longitude between -180 and 180)
  then
    raise exception 'Choose a valid task location pin.';
  end if;
  if
    p_client_reference is null
    or length(p_client_reference) not between 10 and 100
  then
    raise exception 'A valid request reference is required.';
  end if;
  if
    p_public_location is null
    or char_length(btrim(p_public_location)) not between 1 and 250
  then
    raise exception 'Public area/landmark is required.';
  end if;
  if
    p_exact_address is null
    or char_length(btrim(p_exact_address)) not between 1 and 500
  then
    raise exception 'Exact address is required.';
  end if;
  if
    p_contact_phone is null
    or char_length(btrim(p_contact_phone)) not between 1 and 40
  then
    raise exception 'Contact phone is required.';
  end if;
  if p_deadline is null or p_deadline <= now() then
    raise exception 'Deadline must be in the future.';
  end if;
  if
    p_offer_centavos is null
    or p_offer_centavos not between 1 and 100000000
  then
    raise exception 'Offer must be between 1 and 100,000,000 centavos.';
  end if;
  if
    p_category not in (
      'Delivery',
      'Groceries',
      'Documents',
      'Queuing & Bills',
      'Household',
      'Other'
    )
  then
    raise exception 'Invalid category.';
  end if;

  -- Idempotency check
  select *
  into r
  from public.suyo_requests
  where requester_id = auth.uid() and client_reference = p_client_reference;
  if found then
    return r;
  end if;

  v_approx_lat := round(p_latitude::numeric, 2)::double precision;
  v_approx_lng := round(p_longitude::numeric, 2)::double precision;

  insert into public.suyo_requests
    (
      requester_id,
      title,
      details,
      category,
      offer_centavos,
      deadline,
      location,
      notes,
      latitude,
      longitude,
      client_reference
    )
  values
    (
      auth.uid(),
      btrim(p_title),
      btrim(p_details),
      p_category,
      p_offer_centavos,
      p_deadline,
      btrim(p_public_location),
      btrim(coalesce(p_notes, '')),
      v_approx_lat,
      v_approx_lng,
      p_client_reference
    )
  on conflict (requester_id, client_reference) do nothing
  returning *
  into r;

  if r.id is null then
    select *
    into r
    from public.suyo_requests
    where requester_id = auth.uid() and client_reference = p_client_reference;
    return r;
  end if;

  insert into public.request_private_details
    (request_id, exact_address, exact_latitude, exact_longitude, contact_phone)
  values
    (
      r.id,
      btrim(p_exact_address),
      p_latitude,
      p_longitude,
      btrim(p_contact_phone)
    )
  on conflict (request_id) do update
    set
      exact_address = excluded.exact_address,
      exact_latitude = excluded.exact_latitude,
      exact_longitude = excluded.exact_longitude,
      contact_phone = excluded.contact_phone,
      updated_at = now();

  return r;
end;
$$;

create or replace function public.accept_suyo(p_request_id uuid)
returns public.suyo_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.suyo_requests;
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if
    not found
    or r.requester_id = auth.uid()
    or r.status <> 'open'
    or r.deadline <= now()
  then
    raise exception 'This task cannot be accepted.';
  end if;
  update public.applications
  set status = 'rejected'
  where request_id = r.id and status = 'pending' and applicant_id <> auth.uid();
  insert into public.applications (request_id, applicant_id, status)
  values (r.id, auth.uid(), 'accepted')
  on conflict (request_id, applicant_id) do update set status = 'accepted';
  update public.suyo_requests
  set
    provider_id = auth.uid(),
    status = 'assigned'
  where id = r.id
  returning *
  into r;
  return r;
end;
$$;

create or replace function public.change_suyo_status(
  p_request_id uuid,
  p_status text
)
returns public.suyo_requests
language plpgsql
security definer
set search_path = ''
as $$
declare r public.suyo_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  select * into r from public.suyo_requests where id=p_request_id for update;
  if not found then raise exception 'Task unavailable.'; end if;
  if p_status='in_progress' and r.status='assigned' and r.provider_id=auth.uid() then
    update public.suyo_requests set status=p_status where id=r.id returning * into r;
  elsif p_status='cancelled' and r.status in ('open','assigned','in_progress') and (r.requester_id=auth.uid() or r.provider_id=auth.uid()) then
    update public.applications set status='withdrawn' where request_id=r.id and status in ('pending','accepted');
    update public.suyo_requests set status=p_status where id=r.id returning * into r;
  else raise exception 'This status change is not allowed.';
  end if;
  return r;
end; $$;

alter table public.ratings drop constraint ratings_request_id_key;
alter table public.ratings
add constraint ratings_one_per_reviewer unique (request_id, reviewer_id);
-- provider_id is retained as the review recipient for compatibility with existing clients/views.
create or replace function public.rate_suyo_user(
  p_request_id uuid,
  p_score smallint,
  p_comment text default ''
)
returns public.ratings
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.suyo_requests;
  result public.ratings;
  recipient uuid;
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if
    not found
    or r.status <> 'completed'
    or (
      auth.uid() is distinct from r.requester_id
      and auth.uid() is distinct from r.provider_id
    )
  then
    raise exception 'Only participants can review completed tasks.';
  end if;
  recipient := case
    when auth.uid() = r.requester_id then r.provider_id
    else r.requester_id
  end;
  insert into public.ratings
    (request_id, reviewer_id, provider_id, score, comment)
  values (r.id, auth.uid(), recipient, p_score, btrim(coalesce(p_comment, '')))
  returning *
  into result;
  return result;
end;
$$;

drop function public.list_suyo_requests(
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision
);
create or replace function public.list_suyo_requests(
  p_query text default '',
  p_category text default null,
  p_status text default null,
  p_scope text default 'browse',
  p_sort text default 'newest',
  p_origin_latitude double precision default null,
  p_origin_longitude double precision default null,
  p_radius_km double precision default null
)
returns table (
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
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;
  if
    p_radius_km is not null
    and (
      p_radius_km <= 0
      or p_origin_latitude is null
      or p_origin_longitude is null
    )
  then
    raise exception 'Choose a location and a positive radius.';
  end if;
  return query select
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
        when p_origin_latitude is not null
        and p_origin_longitude is not null
        and r.latitude is not null
        and r.longitude is not null then round(
          (
            6371 * acos(
              least(
                1.0,
                greatest(
                  -1.0,
                  cos(radians(p_origin_latitude)) * cos(
                    radians(r.latitude)
                  ) * cos(
                    radians(r.longitude) - radians(p_origin_longitude)
                  ) + sin(radians(p_origin_latitude)) * sin(radians(r.latitude))
                )
              )
            )
          )::numeric,
          1
        )::double precision
        else null
      end as distance_km
    from
      public.suyo_requests r
      join public.profiles p on p.id = r.requester_id
    where
      -- Scope filtering
      (
        (p_scope = 'browse' and r.status = 'open')
        or (p_scope = 'posted' and r.requester_id = auth.uid())
        or (p_scope = 'assigned' and r.provider_id = auth.uid())
        or (
          p_scope = 'applied'
          and exists (
            select 1
            from public.applications a
            where a.request_id = r.id and a.applicant_id = auth.uid()
          )
        )
      )
      and (
        p_radius_km is null
        or (
          r.latitude is not null
          and r.longitude is not null
          and 6371 * acos(
            least(
              1.0,
              greatest(
                -1.0,
                cos(radians(p_origin_latitude)) * cos(
                  radians(r.latitude)
                ) * cos(
                  radians(r.longitude) - radians(p_origin_longitude)
                ) + sin(radians(p_origin_latitude)) * sin(radians(r.latitude))
              )
            )
          ) <= p_radius_km
        )
      )
      -- Optional status override if specified
      and (p_status is null or p_status = '' or r.status = p_status)
      -- Optional category
      and (p_category is null or p_category = '' or r.category = p_category)
      -- Text query
      and (
        p_query is null
        or btrim(p_query) = ''
        or r.title ilike '%' || btrim(p_query) || '%'
        or r.details ilike '%' || btrim(p_query) || '%'
        or r.location ilike '%' || btrim(p_query) || '%'
      )
    order by
      case
        when p_sort = 'reward_desc' then r.offer_centavos
      end desc nulls last,
      case
        when p_sort = 'reward_asc' then r.offer_centavos
      end asc nulls last,
      case
        when p_sort = 'urgency' then r.deadline
      end asc nulls last,
      case
        when p_sort = 'nearest'
        and p_origin_latitude is not null
        and p_origin_longitude is not null
        and r.latitude is not null
        and r.longitude is not null then (
          6371 * acos(
            least(
              1.0,
              greatest(
                -1.0,
                cos(radians(p_origin_latitude)) * cos(
                  radians(r.latitude)
                ) * cos(
                  radians(r.longitude) - radians(p_origin_longitude)
                ) + sin(radians(p_origin_latitude)) * sin(radians(r.latitude))
              )
            )
          )
        )
      end asc nulls last,
      r.created_at desc;
end;
$$;

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
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;
  return query select
      t.request_id,
      r.title,
      case
        when t.requester_id = auth.uid() then 'requester'
        else 'provider'
      end as role,
      case
        when t.requester_id = auth.uid() then t.provider_id
        else t.requester_id
      end as other_user_id,
      p.full_name as other_user_name,
      t.reward_centavos,
      t.currency,
      t.completed_at,
      rt.score as rating_score,
      rt.comment as rating_comment
    from
      public.transactions t
      join public.suyo_requests r on r.id = t.request_id
      join public.profiles p
        on p.id = (
          case
            when t.requester_id = auth.uid() then t.provider_id
            else t.requester_id
          end
        )
      left join public.ratings rt
        on rt.request_id = t.request_id and rt.provider_id = auth.uid()
    where t.requester_id = auth.uid() or t.provider_id = auth.uid()
    order by t.completed_at desc;
end;
$$;

create table public.tracking_consents (
  request_id uuid primary key references public.suyo_requests (id)
    on delete cascade,
  provider_id uuid not null references public.profiles (id),
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);
create table public.live_locations (
  request_id uuid primary key references public.suyo_requests (id)
    on delete cascade,
  provider_id uuid not null references public.profiles (id),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy double precision check (accuracy >= 0),
  speed double precision check (speed >= 0),
  updated_at timestamptz not null default now(),
  arrived boolean not null default false
);
alter table public.tracking_consents enable row level security;
alter table public.live_locations enable row level security;
revoke all
on public.tracking_consents, public.live_locations
from public, anon, authenticated;
grant select
on public.tracking_consents, public.live_locations
to authenticated;
create policy tracking_consent_read on public.tracking_consents
for select
to authenticated
using (suyo_private.is_participant(request_id));
create policy tracking_position_read on public.live_locations
for select
to authenticated
using (suyo_private.is_participant(request_id));

create function public.set_tracking_consent(p_request_id uuid, p_share boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.suyo_requests;
begin
  select * into r from public.suyo_requests where id = p_request_id for update;
  if
    auth.uid() is null
    or not found
    or r.provider_id is distinct from auth.uid()
    or p_share is null
  then
    raise exception 'Only the accepted doer may share location.';
  end if;
  if p_share and r.status not in ('assigned', 'in_progress') then
    raise exception 'Tracking has ended.';
  end if;
  insert into public.tracking_consents
    (request_id, provider_id, consented_at, revoked_at)
  values
    (
      r.id,
      auth.uid(),
      now(),
      case
        when p_share then null
        else now()
      end
    )
  on conflict (request_id) do update
    set
      consented_at = case
        when p_share then now()
        else tracking_consents.consented_at
      end,
      revoked_at = case
        when p_share then null
        else now()
      end;
  if not p_share then
    delete from public.live_locations where request_id = r.id;
  end if;
end;
$$;

create function public.update_task_location(
  p_request_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision default null,
  p_speed double precision default null
)
returns public.live_locations
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.suyo_requests;
  d public.request_private_details;
  result public.live_locations;
  meters double precision;
begin
  select * into r from public.suyo_requests where id = p_request_id for update;
  if
    auth.uid() is null
    or not found
    or r.provider_id is distinct from auth.uid()
    or r.status not in ('assigned', 'in_progress')
  then
    raise exception 'Location sharing has stopped.';
  end if;
  if
    not exists (
      select 1
      from public.tracking_consents
      where
        request_id = r.id
        and provider_id = auth.uid()
        and revoked_at is null
    )
  then
    raise exception 'Location consent required.';
  end if;
  if
    p_latitude is null
    or p_longitude is null
    or not (p_latitude between -90 and 90 and p_longitude between -180 and 180)
  then
    raise exception 'Invalid coordinates.';
  end if;
  select * into d from public.request_private_details where request_id = r.id;
  if d.exact_latitude is not null and d.exact_longitude is not null then
    meters := 6371000 * acos(
      least(
        1.0,
        greatest(
          -1.0,
          cos(radians(p_latitude)) * cos(radians(d.exact_latitude)) * cos(
            radians(d.exact_longitude) - radians(p_longitude)
          ) + sin(radians(p_latitude)) * sin(radians(d.exact_latitude))
        )
      )
    );
  end if;
  insert into public.live_locations
    (request_id, provider_id, latitude, longitude, accuracy, speed, arrived)
  values
    (
      r.id,
      auth.uid(),
      p_latitude,
      p_longitude,
      p_accuracy,
      p_speed,
      coalesce(meters <= 100 and p_accuracy <= 100, false)
    )
  on conflict (request_id) do update
    set
      latitude = excluded.latitude,
      longitude = excluded.longitude,
      accuracy = excluded.accuracy,
      speed = excluded.speed,
      arrived = excluded.arrived,
      updated_at = now()
  returning *
  into result;
  return result;
end;
$$;

create function suyo_private.stop_task_tracking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status not in ('assigned', 'in_progress') then
    update public.tracking_consents
    set revoked_at = coalesce(revoked_at, now())
    where request_id = new.id;
    delete from public.live_locations where request_id = new.id;
  end if;
  return new;
end;
$$;
create trigger stop_task_tracking
after update of status on public.suyo_requests
for each row
execute function suyo_private.stop_task_tracking();
-- Realtime is available in Supabase; local PostgreSQL tests do not create this publication.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  alter publication supabase_realtime add table public.live_locations,public.tracking_consents;
 end if;
end $$;
revoke all
on function public.accept_suyo(uuid),
public.rate_suyo_user(uuid, smallint, text),
public.set_tracking_consent(uuid, boolean),
public.update_task_location(
  uuid,
  double precision,
  double precision,
  double precision,
  double precision
),
public.list_suyo_requests(
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  double precision
)
from public, anon;
grant execute
on function public.accept_suyo(uuid),
public.rate_suyo_user(uuid, smallint, text),
public.set_tracking_consent(uuid, boolean),
public.update_task_location(
  uuid,
  double precision,
  double precision,
  double precision,
  double precision
),
public.list_suyo_requests(
  text,
  text,
  text,
  text,
  text,
  double precision,
  double precision,
  double precision
)
to authenticated;
commit;
