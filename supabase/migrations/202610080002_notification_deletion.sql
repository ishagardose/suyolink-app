begin;

-- Recipients can remove their own inbox records; task history is retained.
grant delete on public.notifications to authenticated;
create policy notifications_delete_own on public.notifications
for delete
to authenticated
using (recipient_id = (select auth.uid()));

commit;
