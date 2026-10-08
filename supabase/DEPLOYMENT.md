# Deploy the dynamic workflows

The source changes are not automatically applied to the hosted Supabase project.

## SQL order

For the project shown in the supplied export, run each complete file in SQL Editor, in this order:

1. `migrations/202609300001_core_mvp_privacy_transactions.sql` (if it has not already been applied).
2. `migrations/202610040001_dynamic_workflows.sql`.
3. `migrations/202610040002_push_notifications.sql`.
4. `migrations/202610080001_backend_profiles.sql` (required by the updated My Profile page).

These are transactional, one-time migrations. Do not rerun successful files: policies and tables intentionally detect duplicate application. If using the Supabase CLI, reconcile migration history before `db push` when earlier SQL was run manually.

The core migration moves existing exact addresses/pins into private details, replaces public locations with a generic area, and rounds public coordinates. It preserves missing historical coordinates as null and moves the old `Contact Phone:` field out of public notes. The follow-up also removes those known generated phone lines. Manually entered sensitive text in descriptions/remarks needs review; SQL cannot reliably identify every address or phone number in prose.

The follow-up disables legacy posting RPCs; deploy the updated frontend with it. It adds direct acceptance alongside applications, participant cancellation before proof review, one review per participant, radius filtering, tracking consent, latest position storage, and Realtime publication membership. Cancellation retains the provider for task history but hides exact contact/address fields from that provider after cancellation.

## Push service

1. Link this app to your EAS project and configure its `extra.eas.projectId` plus Android FCM / iOS APNs credentials. Build a new native app with the installed `expo-notifications` plugin. No project ID or credentials are fabricated in this repo.
2. Set a random server-only `PUSH_WORKER_SECRET` in Supabase Edge Function secrets. If Expo push security is enabled, also set `EXPO_ACCESS_TOKEN`. Never put either in `EXPO_PUBLIC_*` variables.
3. Deploy `supabase/functions/send-push` using the included function configuration. It rejects requests without the worker secret, even though gateway JWT verification is disabled for this scheduled endpoint.
4. Schedule a POST to `/functions/v1/send-push` every minute using your scheduler, with `Authorization: Bearer <PUSH_WORKER_SECRET>`. Keep that secret in the scheduler's secret store. The function ignores request bodies and takes jobs only from the database queue.
5. In the native app, use Notifications -> Enable device notifications. Disabling notifications/signing out unregisters the device.

The worker leases up to 50 jobs, retries failed sends up to five times, checks Expo receipts after 15 minutes, and removes invalid devices. Push bodies are generic; details load after authenticated navigation. Expo delivery is at-least-once: an interrupted worker can retry an already accepted send. Monitor `push_outbox.last_error` and jobs that exhaust attempts. Web retains the database inbox; device push is native only.

## Tracking behavior and limits

GPS sharing requires explicit consent and foreground permission. Only the accepted doer can upload; only the participants can read. Realtime events update maps, with six-second polling as a reconnect fallback. The app stops its watcher when leaving the tracking screen/backgrounding; submitting proof, completing, or cancelling also revokes consent and deletes positions on the server. A killed/offline app may leave a stale last position until the task ends; the UI hides positions older than 30 seconds.

Distance and ETA use straight-line distance and actual device speed, not road routing. No background tracking or road-routing provider is configured. Native permission, Realtime delivery, push delivery, and the full hosted workflow need device/project testing after deployment.

Optional chat and identity-document verification are not part of this implementation. Auth sessions continue to use SecureStore on native. Request attachments that were only local previews were removed from the posting form; proof-photo storage remains supported.

## Backend profiles

Deploy `202610080001_backend_profiles.sql` before the updated app. It adds public handle/bio fields with owner-only writes and an authenticated `get_suyo_profile` RPC. Completed counts include tasks participated in as requester or doer, preserving the existing profile meaning; ratings average reviews received. Empty profiles have zero completed tasks and no rating. Contact phone/address remain private under existing RLS. There is no identity-verification field, so the app no longer displays a verification badge.

Handles and bios previously stored only on a device are not uploaded automatically. Users can save them through Edit Profile to persist them in Supabase. No hosted project is linked in this checkout; local tests do not apply migrations to your hosted database.
