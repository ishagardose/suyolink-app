begin;
alter table public.suyo_requests
  add column latitude double precision,
  add column longitude double precision,
  add column client_reference text,
  add constraint request_coordinates_valid check (
    (latitude is null and longitude is null) or
    (latitude is not null and longitude is not null
      and latitude between -90 and 90 and longitude between -180 and 180)
  ),
  add constraint request_client_reference_unique unique (requester_id, client_reference);

create function public.create_suyo_request_at_location(
  p_title text, p_details text, p_category text, p_offer_centavos integer,
  p_deadline timestamptz, p_location text, p_notes text,
  p_latitude double precision, p_longitude double precision, p_client_reference text
) returns public.suyo_requests
language plpgsql security definer set search_path = '' as $$
declare r public.suyo_requests;
begin
  if auth.uid() is null then raise exception 'Please sign in.'; end if;
  if p_latitude is null or p_longitude is null
    or not (p_latitude between -90 and 90 and p_longitude between -180 and 180)
    then raise exception 'Choose a valid task location pin.'; end if;
  if p_client_reference is null or length(p_client_reference) not between 10 and 100
    then raise exception 'A valid request reference is required.'; end if;
  select * into r from public.suyo_requests
    where requester_id = auth.uid() and client_reference = p_client_reference;
  if found then return r; end if;
  if p_deadline is null or p_deadline <= now() then raise exception 'Deadline must be in the future.'; end if;
  insert into public.suyo_requests(requester_id, title, details, category, offer_centavos,
    deadline, location, notes, latitude, longitude, client_reference)
  values (auth.uid(), btrim(p_title), btrim(p_details), p_category, p_offer_centavos,
    p_deadline, btrim(p_location), btrim(coalesce(p_notes, '')), p_latitude, p_longitude, p_client_reference)
  on conflict (requester_id, client_reference) do nothing returning * into r;
  if r.id is null then
    select * into r from public.suyo_requests
      where requester_id = auth.uid() and client_reference = p_client_reference;
  end if;
  return r;
end;
$$;
revoke all on function public.create_suyo_request_at_location(text,text,text,integer,timestamptz,text,text,double precision,double precision,text) from public, anon, authenticated;
grant execute on function public.create_suyo_request_at_location(text,text,text,integer,timestamptz,text,text,double precision,double precision,text) to authenticated;
notify pgrst, 'reload schema';
commit;
