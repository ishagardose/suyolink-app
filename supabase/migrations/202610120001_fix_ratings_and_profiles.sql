begin;

-- 1. Allow ratings to be updated by their reviewers
create policy ratings_update on public.ratings
for update
to authenticated
using (reviewer_id = (select auth.uid()))
with check (reviewer_id = (select auth.uid()));

-- 2. Update rate_suyo_user to allow ratings for completed, awaiting_confirmation, or in_progress tasks
-- and auto-complete the task when reviewed by requester
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
    or r.status not in ('completed', 'awaiting_confirmation', 'in_progress')
    or (
      auth.uid() is distinct from r.requester_id
      and auth.uid() is distinct from r.provider_id
    )
  then
    raise exception 'Only participants can review completed tasks.';
  end if;

  -- If the requester is rating, mark the task completed if not already completed
  if auth.uid() = r.requester_id and r.status in ('awaiting_confirmation', 'in_progress') then
    update public.suyo_requests
    set status = 'completed', completed_at = coalesce(completed_at, now())
    where id = r.id
    returning * into r;

    insert into public.transactions
      (
        request_id,
        requester_id,
        provider_id,
        reward_centavos,
        currency,
        completed_at
      )
    values
      (
        r.id,
        r.requester_id,
        r.provider_id,
        r.offer_centavos,
        r.currency,
        coalesce(r.completed_at, now())
      )
    on conflict (request_id) do nothing;
  end if;

  recipient := case
    when auth.uid() = r.requester_id then r.provider_id
    else r.requester_id
  end;

  if recipient is null then
    raise exception 'Review recipient is unavailable.';
  end if;

  insert into public.ratings
    (request_id, reviewer_id, provider_id, score, comment)
  values (r.id, auth.uid(), recipient, p_score, btrim(coalesce(p_comment, '')))
  returning *
  into result;

  return result;
end;
$$;

-- 3. Add function to update an existing rating and comment
create or replace function public.update_suyo_rating(
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
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;

  select * into r from public.suyo_requests where id = p_request_id;
  if
    not found
    or (
      auth.uid() is distinct from r.requester_id
      and auth.uid() is distinct from r.provider_id
    )
  then
    raise exception 'Only participants can update reviews.';
  end if;

  update public.ratings
  set
    score = p_score,
    comment = btrim(coalesce(p_comment, '')),
    created_at = now()
  where request_id = p_request_id and reviewer_id = auth.uid()
  returning * into result;

  if not found then
    raise exception 'No review found to update.';
  end if;

  return result;
end;
$$;

revoke all on function public.update_suyo_rating(uuid, smallint, text) from public, anon;
grant execute on function public.update_suyo_rating(uuid, smallint, text) to authenticated;

-- 4. Update get_suyo_profile to use LEFT JOIN so reviews are never dropped if profile join has edge cases
create or replace function public.get_suyo_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Please sign in.';
  end if;

  select
    jsonb_build_object(
      'id',
      p.id,
      'full_name',
      p.full_name,
      'handle',
      p.handle,
      'bio',
      p.bio,
      'completed_count',
      (
        select count(*)
        from public.suyo_requests r
        where
          r.status = 'completed'
          and (r.provider_id = p.id or r.requester_id = p.id)
      ),
      'rating',
      (
        select round(avg(rt.score), 1)
        from public.ratings rt
        where rt.provider_id = p.id
      ),
      'reviews',
      coalesce(
        (
          select
            jsonb_agg(
              jsonb_build_object(
                'id',
                rt.id,
                'score',
                rt.score,
                'comment',
                rt.comment,
                'created_at',
                rt.created_at,
                'reviewer_id',
                rt.reviewer_id,
                'request_id',
                rt.request_id,
                'reviewerName',
                coalesce(reviewer.full_name, 'Community Member')
              )
              order by rt.created_at desc, rt.id
            )
          from
            public.ratings rt
            left join public.profiles reviewer on reviewer.id = rt.reviewer_id
          where rt.provider_id = p.id
        ),
        '[]'::jsonb
      )
    )
  into result
  from public.profiles p
  where p.id = p_user_id;

  if result is null then
    raise exception 'Profile not found.';
  end if;

  return result;
end;
$$;

revoke all on function public.get_suyo_profile(uuid) from public, anon;
grant execute on function public.get_suyo_profile(uuid) to authenticated;

commit;
