begin;

alter table public.profiles
add column handle text not null default '' check (char_length(handle) <= 40),
add column bio text not null default '' check (char_length(bio) <= 1000);
grant update (handle, bio) on public.profiles to authenticated;

-- Public identity and aggregates only; no private task or contact rows.
create function public.get_suyo_profile(p_user_id uuid)
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
                reviewer.full_name
              )
              order by rt.created_at desc, rt.id
            )
          from
            public.ratings rt
            join public.profiles reviewer on reviewer.id = rt.reviewer_id
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
