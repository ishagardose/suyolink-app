-- Keep task history and notifications; points are deferred until a later release.
-- Existing ledger entries are preserved.
begin;
create or replace function suyo_private.record_request_event() returns trigger
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
  return new;
end;
$$;
commit;
