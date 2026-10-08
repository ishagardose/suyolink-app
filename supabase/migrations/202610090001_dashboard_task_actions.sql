-- Apply after 202610080002. Persist dashboard edits and absolute reward boosts.
begin;

alter table public.suyo_requests
add column reward_boost_centavos integer not null default 0 check (
  reward_boost_centavos >= 0
  and reward_boost_centavos < offer_centavos
);

-- A reward edit establishes a new base offer and clears the selected boost.
create function public.edit_suyo_request(
  p_request_id uuid,
  p_title text,
  p_details text,
  p_notes text,
  p_offer_centavos integer
)
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
  if not found or r.requester_id is distinct from auth.uid() then
    raise exception 'Only the requester can edit this task.';
  end if;
  if r.status <> 'open' or r.deadline <= now() then
    raise exception 'Only open, unexpired tasks can be edited.';
  end if;
  if p_title is null or char_length(btrim(p_title)) not between 1 and 100 then
    raise exception 'Title must contain 1 to 100 characters.';
  end if;
  if
    p_details is null
    or char_length(btrim(p_details)) not between 1 and 2000
  then
    raise exception 'Description must contain 1 to 2000 characters.';
  end if;
  if char_length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Notes must contain at most 1000 characters.';
  end if;
  if
    p_offer_centavos is null
    or p_offer_centavos not between 1 and 100000000
  then
    raise exception 'Offer must be between 1 and 100,000,000 centavos.';
  end if;
  update public.suyo_requests
  set
    title = btrim(p_title),
    details = btrim(p_details),
    notes = btrim(coalesce(p_notes, '')),
    offer_centavos = p_offer_centavos,
    reward_boost_centavos = 0
  where id = r.id
  returning *
  into r;
  return r;
end;
$$;

-- Set a boost relative to the stored base, rather than repeatedly adding it.
create function public.set_suyo_reward_boost(
  p_request_id uuid,
  p_boost_centavos integer
)
returns public.suyo_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.suyo_requests;
  v_offer integer;
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;
  select * into r from public.suyo_requests where id = p_request_id for update;
  if not found or r.requester_id is distinct from auth.uid() then
    raise exception 'Only the requester can boost this task.';
  end if;
  if r.status <> 'open' or r.deadline <= now() then
    raise exception 'Only open, unexpired tasks can be boosted.';
  end if;
  if
    p_boost_centavos is null
    or p_boost_centavos not in (0, 2000, 5000, 10000)
  then
    raise exception 'Choose a supported reward boost.';
  end if;
  v_offer := r.offer_centavos - r.reward_boost_centavos + p_boost_centavos;
  if v_offer not between 1 and 100000000 then
    raise exception 'Total offer exceeds the reward limit.';
  end if;
  update public.suyo_requests
  set
    offer_centavos = v_offer,
    reward_boost_centavos = p_boost_centavos
  where id = r.id
  returning *
  into r;
  return r;
end;
$$;

-- Extend the existing privacy-safe listing with the persisted boost.
drop function public.list_suyo_requests(
  text,
  text,
  text,
  text,
  text,
  double precision,
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
  distance_km double precision,
  reward_boost_centavos integer
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
      end as distance_km,
      r.reward_boost_centavos
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

create or replace function public.get_suyo_details(p_request_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
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
    'reward_boost_centavos', r.reward_boost_centavos,
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

revoke all
on function public.edit_suyo_request(uuid, text, text, text, integer)
from public, anon;
revoke all
on function public.set_suyo_reward_boost(uuid, integer)
from public, anon;
revoke all
on function public.list_suyo_requests(
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
on function public.edit_suyo_request(uuid, text, text, text, integer)
to authenticated;
grant execute
on function public.set_suyo_reward_boost(uuid, integer)
to authenticated;
grant execute
on function public.list_suyo_requests(
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
