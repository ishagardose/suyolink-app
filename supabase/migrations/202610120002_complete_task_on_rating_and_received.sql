begin;

-- 1. Function for requester to mark a task as received and transition it to completed
create or replace function public.mark_suyo_received(
  p_request_id uuid
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
  if not found then
    raise exception 'Task unavailable.';
  end if;

  if r.requester_id <> auth.uid() then
    raise exception 'Only the requester can mark a suyo as received.';
  end if;

  -- Auto-accept any submitted proofs
  update public.proofs
  set status = 'accepted', reviewed_at = now()
  where request_id = r.id and status = 'submitted';

  if r.status in ('awaiting_confirmation', 'in_progress', 'assigned') then
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

  return r;
end;
$$;

-- 2. Allow change_suyo_status to accept 'completed' by requester or provider
create or replace function public.change_suyo_status(
  p_request_id uuid,
  p_status text
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
  if not found then
    raise exception 'Task unavailable.';
  end if;

  if p_status = 'in_progress' and r.status = 'assigned' and r.provider_id = auth.uid() then
    update public.suyo_requests set status = p_status where id = r.id returning * into r;
  elsif p_status = 'completed' and (r.requester_id = auth.uid() or r.provider_id = auth.uid()) then
    update public.proofs
    set status = 'accepted', reviewed_at = now()
    where request_id = r.id and status = 'submitted';

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
  elsif p_status = 'cancelled' and r.status in ('open', 'assigned', 'in_progress') and (r.requester_id = auth.uid() or r.provider_id = auth.uid()) then
    update public.applications set status = 'withdrawn' where request_id = r.id and status in ('pending', 'accepted');
    update public.suyo_requests set status = p_status where id = r.id returning * into r;
  else
    raise exception 'This status change is not allowed.';
  end if;

  return r;
end;
$$;

-- 3. Update update_suyo_rating to mark task as completed if reviewed by requester
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

  select * into r from public.suyo_requests where id = p_request_id for update;
  if
    not found
    or (
      auth.uid() is distinct from r.requester_id
      and auth.uid() is distinct from r.provider_id
    )
  then
    raise exception 'Only participants can update reviews.';
  end if;

  -- If requester is updating/submitting rating, mark the task completed if not already completed
  if auth.uid() = r.requester_id and r.status in ('awaiting_confirmation', 'in_progress', 'assigned') then
    update public.proofs
    set status = 'accepted', reviewed_at = now()
    where request_id = r.id and status = 'submitted';

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

  update public.ratings
  set
    score = p_score,
    comment = btrim(coalesce(p_comment, '')),
    created_at = now()
  where request_id = p_request_id and reviewer_id = auth.uid()
  returning *
  into result;

  return result;
end;
$$;

commit;
