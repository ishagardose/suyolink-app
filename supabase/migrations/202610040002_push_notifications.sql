begin;
create table public.push_tokens (
 token text primary key check(length(token) between 10 and 300),
 user_id uuid not null references public.profiles(id) on delete cascade,
 updated_at timestamptz not null default now()
);
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public,anon,authenticated;
create function public.register_push_token(p_token text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Please sign in.'; end if;
 if p_token is null or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$' then raise exception 'Invalid push token.'; end if;
 insert into public.push_tokens(token,user_id) values(p_token,auth.uid()) on conflict(token) do update set user_id=auth.uid(),updated_at=now();
end; $$;
create function public.remove_push_token(p_token text) returns void language sql security definer set search_path='' as $$
 delete from public.push_tokens where token=p_token and user_id=auth.uid();
$$;
create table public.push_outbox (
 id uuid primary key default gen_random_uuid(),
 notification_id uuid not null references public.notifications(id) on delete cascade,
 token text not null references public.push_tokens(token) on delete cascade,
 attempts integer not null default 0, available_at timestamptz not null default now(),
 sent_at timestamptz, ticket_id text, last_error text,
 unique(notification_id,token)
);
alter table public.push_outbox enable row level security;
revoke all on public.push_outbox from public,anon,authenticated;
grant select,update,delete on public.push_outbox to service_role;
grant select,delete on public.push_tokens to service_role;
create function suyo_private.queue_push() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.push_outbox(notification_id,token) select new.id,token from public.push_tokens where user_id=new.recipient_id;
 return new;
end; $$;
create trigger queue_notification_push after insert on public.notifications for each row execute function suyo_private.queue_push();
create function public.claim_push_jobs() returns table(id uuid,token text,request_id uuid,recipient_id uuid)
language sql security definer set search_path='' as $$
 with selected as (
  select q.id from public.push_outbox q where q.sent_at is null and q.attempts<5 and q.available_at<=now()
  order by q.available_at limit 50 for update skip locked
 ), claimed as (
  update public.push_outbox q set attempts=q.attempts+1,available_at=now()+interval '5 minutes'
  from selected s where q.id=s.id returning q.*
 ) select c.id,c.token,n.request_id,n.recipient_id from claimed c
 join public.notifications n on n.id=c.notification_id
 join public.push_tokens t on t.token=c.token and t.user_id=n.recipient_id;
$$;
revoke all on function public.register_push_token(text),public.remove_push_token(text) from public,anon;
grant execute on function public.register_push_token(text),public.remove_push_token(text) to authenticated;
revoke all on function public.claim_push_jobs() from public,anon,authenticated;
grant execute on function public.claim_push_jobs() to service_role;
commit;
