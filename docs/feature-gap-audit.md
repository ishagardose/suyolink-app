# SuyoLink feature-gap audit

> Historical audit: local implementation has since changed. See `supabase/DEPLOYMENT.md` and README.md for the dynamic workflow, tracking, and push changes. Hosted deployment and device verification remain separate steps.

Reviewed: 2026-10-04. Scope: current local frontend, contexts, data APIs, helpers, and committed Supabase migrations. This is a source-code audit, not verification of a deployed Supabase project, email delivery, real devices, or production data. Earlier build and UI structure checks do not establish end-to-end completion of this checklist.

## Live database export follow-up (2026-10-04)

The user supplied a schema export from Supabase after the original source audit. This section takes precedence over any earlier wording that could imply local migrations are deployed. No remote database changes or live API tests were performed.

### Confirmed deployment mismatch

The export contains nine public tables, but is missing `request_private_details`, `profile_last_locations`, and `transactions`. It also lacks five RPCs called by `data/suyoApi.js`: `create_suyo_request_v2`, `list_suyo_requests`, `get_suyo_details`, `save_last_location`, and `get_my_transactions`.

These objects are defined in the local `supabase/migrations/202609300001_core_mvp_privacy_transactions.sql`. The export is consistent with that migration not having been applied (or its objects subsequently being removed). Migration-history records were not included, so the exact cause is unconfirmed. If this is the project's database used by the app, those calls cannot succeed with the exported schema. Posting, listing, details, server location persistence, and transaction history therefore have deployment blockers in addition to frontend integration gaps.

### What is present in the supplied database

- Profiles and private profile contacts, requests, applications, proofs, ratings, notifications, request events, and the legacy points ledger.
- RLS enabled on all nine exported public tables; policies reference private authorization helpers.
- Apply/withdraw, requester application decisions, status changes, proof submission/review, and requester-to-provider rating RPCs.
- A private `suyo-proofs` bucket restricted to JPEG/PNG/WebP and 10 MiB, with upload/read policies.
- Provider rating aggregate view and auth-user creation/status-event triggers.

### Findings strengthened by the export

- `review_suyo_proof` completes requests but does not insert monetary transaction records; the transaction table is absent.
- `create_suyo_request_at_location` writes supplied coordinates and location directly into `suyo_requests`; it does not round public coordinates or separate exact details. Whether existing rows contain sensitive values was not inspected.
- `ratings` has `UNIQUE (request_id)` and the rating RPC only allows the requester to rate a completed task, confirming the reciprocal-review gap.
- No public tracking, consent, conversations, messages, or push-token tables appear. This agrees with the repository findings, but does not exclude infrastructure in other schemas or external services.

### Export limits and next step

The query omitted function definitions in `suyo_private`, although RLS policies and triggers depend on them. It also omitted table/function grants, view security options, migration history, Realtime publication membership, Edge Functions, and Auth/email configuration. RLS flags alone do not prove the complete authorization behavior. The exported public functions use SECURITY DEFINER with an empty search path, but a full permission audit requires those omitted details.

Review the pending migration and its data backfill before applying it: it changes existing public locations to a generic label, rounds public coordinates, and backfills private details with placeholder phone values. It does not fix the form's phone-in-notes duplication. Align that migration with the privacy fixes, then verify posting through completion against the intended Supabase project.

## Main findings

1. **Fix public contact/address leakage first.** RequestForm copies the phone into notes, which list/detail APIs return publicly to authorized marketplace viewers. It also uses the same address as both public location and private exact address. Private-field access controls cannot protect duplicate values stored in public fields. Audit any existing records created through this form; do not assume a frontend fix removes older copies.
2. **Connect the real workflow to the main UI.** Backend-backed /suyo, /proof, /review-proof, /rate-suyo, /notifications, and /transactions exist. The main dashboard, /submit-proof, /rate-doer, /rate-requester, /wallet, and /activity still contain local/demo behavior.
3. **GPS tracking is not implemented end-to-end.** Browsing-location permission, pin selection, and straight-line distance helpers exist; task consent, ongoing sharing, live updates, ETA, arrival, and stop/cleanup do not.
4. **Matching and reviews differ from the spec.** Actual backend matching is apply -> requester chooses, with concurrency controls. Direct acceptance is absent. Ratings are requester -> provider only, with one row total per task.
5. **Push notifications and chat are absent.** Database notifications exist; they are not device pushes.
6. **DEV_PREVIEW is still true.** The root navigator bypasses login route guards. Supabase authorization remains a separate layer; this flag does not itself prove a database bypass.

Legend: PRESENT IN CODE means an implementation was found, not that deployed behavior was verified. PARTIAL means incomplete requirements or integration. DEMO means visible UI without the corresponding real workflow. MISSING means no implementation was found in the inspected repository.

## Frontend checklist

### F1. Location explanation / Allow / Not now ? PARTIAL

Explanation and foreground permission request exist. The displayed Not now button has an empty handler, so the skip flow is not implemented.

Source: [components/onboarding/SetLocationScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/onboarding/SetLocationScreen.jsx).

### F2. Permission denied / Open settings / manual fallback ? MOSTLY PRESENT

Denied banner, settings action, and manual map pin exist. No address search/geocoding fallback on this screen; settings behavior on web and devices needs verification.

Source: [context/LocationContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/LocationContext.jsx).

### F3. Post a suyo form ? PARTIAL / PRIVACY BUG

All requested field types and Post action exist. Submission copies contact phone into public notes, uses the same text for public and exact address, and silently substitutes fixed coordinates when no pin is selected. These prevent marking the feature complete.

Source: [components/requests/RequestForm.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/requests/RequestForm.jsx).

### F4. Suyo details / private contact / Accept / Cancel ? PARTIAL

The /suyo route loads role-aware details and provides Call/Copy for returned private fields. Matching is apply-and-requester-approve, not direct doer Accept. Cancellation is requester-only while open. The task map link leads to a static tracking illustration that ignores requestId. Dashboard detail dialogs follow a separate local/demo flow.

Source: [components/suyo/SuyoScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/suyo/SuyoScreen.jsx).

### F5. My suyos with status filters ? PARTIAL / DEMO MIX

Status tabs exist and server list RPC supports posted scope/status. Dashboard lists start with preview records and maintain several mutations in local state; this is not a single authoritative backend list.

Source: [components/dashboard/DashboardScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/dashboard/DashboardScreen.jsx).

### F6. Notifications: list / read state / related screen ? PARTIAL INTEGRATION

/notifications uses database notifications and markRead, opening /suyo. The dashboard bell opens a separate seeded local inbox, so normal dashboard notifications do not reflect those records.

Source: [hooks/dashboard/useDashboardNotifications.js](C:/Users/markj/Desktop/cce106/suyolink-app/hooks/dashboard/useDashboardNotifications.js).

### F7. Proof capture / preview / retake / note / submit ? PARTIAL INTEGRATION

/proof implements image capture/selection, preview, retake, private upload, and submit_suyo_proof. The fulfillment path instead navigates to /submit-proof, whose Submit action only runs a timer and displays success.

Source: [components/proof/SubmitProofScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/proof/SubmitProofScreen.jsx).

### F8. Requester confirms completion / reports problem ? PARTIAL INTEGRATION

/review-proof calls review_suyo_proof and supports approving or rejecting with a reason. This is a request-changes flow, not a full dispute/ticket workflow. The separate requester-fulfill demo flow is not the same backend confirmation path.

Source: [components/proof/ReviewProofScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/proof/ReviewProofScreen.jsx).

### F9. Rating: stars / review / Submit ? PARTIAL INTEGRATION

/rate-suyo persists a requester-to-provider rating. /rate-doer and /rate-requester use RatingScreen, whose submit handler only opens a success modal. Provider-to-requester persistence is missing.

Source: [components/ratings/RatingScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/ratings/RatingScreen.jsx).

### F10. Transactions / reviews / earned and spent totals ? PARTIAL INTEGRATION

/transactions fetches real completed records and computes totals. /wallet and /activity still render preview earnings. Reviews are currently one-directional; the transaction query joins the same rating for either viewer, rather than explicitly selecting reviews received.

Source: [components/transactions/TransactionsScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/transactions/TransactionsScreen.jsx).

### F11. Tracking consent prompt ? MISSING

No dedicated Share location / Cancel consent flow found. Foreground browsing-location permission is not task-specific tracking consent.

Source: [context/LocationContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/LocationContext.jsx).

### F12. Requester live tracking: marker / destination / ETA / status ? DEMO ONLY

/map renders a static image with hardcoded ETA and progress. Fulfillment map markers use fixed coordinates, not a live doer feed.

Source: [components/maps/MapScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/maps/MapScreen.jsx).

### F13. Doer live tracking: position / sharing label / Start / Arrived ? PARTIAL UI; LIVE FEATURE MISSING

A backend Start task action exists separately, but no ongoing position watcher, live sharing state, or arrival action connected to GPS was found.

Source: [components/fulfillment/FulfillScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/fulfillment/FulfillScreen.jsx).

### F14. Tracking stopped message ? MISSING

No tracking stop lifecycle or stopped message found.

Source: [context/LocationContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/LocationContext.jsx).

### Optional frontend. Messages list / chat ? MISSING

Chat-looking icons and a toast exist, but no message list or conversation screen with messaging behavior was found.

Source: [components/dashboard/modals/DoerProfileModal.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/dashboard/modals/DoerProfileModal.jsx).

## Backend checklist

### B1. Database tables ? PARTIAL

Auth users/profiles, suyos, applications, proofs, notifications, ratings, transactions, private task details, and saved locations exist in migrations. Tracking consent and live-position tables are missing.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B2. Register / login / OTP sending and verification ? PRESENT IN CODE

Supabase Auth signUp, password login, resend, and verifyOtp are wired. Deployed email templates, delivery, and confirmation configuration were not verified. DEV_PREVIEW still bypasses route login guards.

Source: [context/AuthContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/AuthContext.jsx).

### B3. Encrypted ID storage ? UNCLEAR / PARTIAL

Native auth-session storage uses Expo SecureStore; web uses browser storage. If ID means a government-ID document/number, there is no identity-document upload, encrypted storage workflow, verification model, or retention process.

Source: [lib/authStorage.native.js](C:/Users/markj/Desktop/cce106/suyolink-app/lib/authStorage.native.js).

### B4. Save last known location ? PRESENT WITH LIMIT

save_last_location/get_my_last_location and per-user cache exist. This is a saved browsing area, not periodic GPS tracking. Server-save failures are swallowed and no durable retry queue is evident.

Source: [context/LocationContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/LocationContext.jsx).

### B5. Create suyo API with coordinates and contact ? PRESENT IN CODE

create_suyo_request_v2 atomically stores public/private details and supports client-reference idempotency. Frontend public-field leakage still needs fixing.

Source: [data/suyoApi.js](C:/Users/markj/Desktop/cce106/suyolink-app/data/suyoApi.js).

### B6. List/filter/sort by reward, urgency, nearest ? BACKEND PRESENT; UI PARTIAL

list_suyo_requests supports reward_desc, reward_asc, urgency, nearest, category, status, and scopes. The active dashboard filter hook sorts by creation time and does not expose/connect all requested sort choices.

Source: [supabase/migrations/202609300001_core_mvp_privacy_transactions.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609300001_core_mvp_privacy_transactions.sql).

### B7. Get by ID; role-limited phone ? PRESENT WITH BYPASS IN INPUT DATA

get_suyo_details conditionally returns dedicated private fields to requester/assigned provider. However, the posting form copies phone into public notes, bypassing that protection through another field.

Source: [supabase/migrations/202609300001_core_mvp_privacy_transactions.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609300001_core_mvp_privacy_transactions.sql).

### B8. Atomic direct acceptance; block competing doers ? PARTIAL / DIFFERENT WORKFLOW

apply_to_suyo plus decide_application locks the request row and enforces a unique accepted application. There is no direct first-doer-wins acceptance API matching the checklist.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B9. Cancel API ? PARTIAL

change_suyo_status permits the requester to cancel an open request. Accepted/in-progress cancellation by participants is not implemented by this RPC; local dashboard Cancel actions do not expand backend support.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B10. Posted suyos by user with status filter ? PRESENT IN CODE

list_suyo_requests supports posted scope for auth.uid() and p_status. Dashboard integration still mixes local sample state.

Source: [data/suyoApi.js](C:/Users/markj/Desktop/cce106/suyolink-app/data/suyoApi.js).

### B11. Status lifecycle ? PRESENT WITH NAMING DIFFERENCES

open -> assigned -> in_progress -> awaiting_confirmation -> completed; open can become cancelled, and rejected proof returns to in_progress. assigned corresponds to accepted; awaiting_confirmation corresponds to proof submitted.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B12. Distance calculation ? PRESENT IN CODE

Client distanceKm and SQL spherical distance calculations exist. This is straight-line distance, not road travel distance.

Source: [lib/geo.js](C:/Users/markj/Desktop/cce106/suyolink-app/lib/geo.js).

### B13. Nearby query ? PARTIAL

Server can calculate distance and sort nearest, but list RPC has no radius parameter/predicate. Distance-radius filtering is currently client-side.

Source: [supabase/migrations/202609300001_core_mvp_privacy_transactions.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609300001_core_mvp_privacy_transactions.sql).

### B14. Approximate public location; private exact address ? PARTIAL / PRIVACY BUG

Public coordinates are rounded and private coordinates/address stored separately, but frontend submission places the exact same entered address into the public location field.

Source: [components/requests/RequestForm.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/requests/RequestForm.jsx).

### B15. Mask home address/contact on public profiles ? PARTIAL

Backend separates protected profile_contacts from public profiles. Account/profile screens still use parameter/default demo information; an authoritative public-profile flow is not fully integrated. Posting-field leakage must also be removed.

Source: [components/account/AccountScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/account/AccountScreen.jsx).

### B16. Notifications on status changes ? PRESENT IN CODE

record_request_event trigger writes task history and notifications to the other participant; application actions also create notifications. Dashboard inbox integration is missing.

Source: [supabase/migrations/202609270001_defer_points.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609270001_defer_points.sql).

### B17. Push notifications ? MISSING

No expo-notifications dependency, device token registration/store, push sender, or push delivery worker found. In-app database notification rows do not send device pushes.

Source: [package.json](C:/Users/markj/Desktop/cce106/suyolink-app/package.json).

### B18. Mark notification read ? PRESENT IN CODE

SuyoContext updates read_at filtered by notification and recipient; policies limit access. Dashboard demo read state is separate.

Source: [context/SuyoContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/SuyoContext.jsx).

### B19. Upload proof photo ? PRESENT IN CODE

Private suyo-proofs bucket, MIME/size validation, participant access rules, and upload helper exist. Wired through /proof rather than the main demo submit-proof flow.

Source: [lib/proofUpload.js](C:/Users/markj/Desktop/cce106/suyolink-app/lib/proofUpload.js).

### B20. Save proof path and change status ? PRESENT IN CODE

submit_suyo_proof validates assigned provider, task state, folder, and uploaded object; stores path/note and sets awaiting_confirmation.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B21. Confirm completion API ? PRESENT IN CODE

review_suyo_proof is requester-only, validates current proof/state, and supports safe repeated confirmation.

Source: [supabase/migrations/202609300001_core_mvp_privacy_transactions.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609300001_core_mvp_privacy_transactions.sql).

### B22. Create transaction record ? PRESENT IN CODE

Successful proof approval inserts a transaction with on conflict(request_id) do nothing. This records a reward; it does not process payment.

Source: [supabase/migrations/202609300001_core_mvp_privacy_transactions.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609300001_core_mvp_privacy_transactions.sql).

### B23. One rating per user per suyo ? PARTIAL

Schema makes request_id alone unique, and rate_suyo_provider only permits the requester. This allows one rating total per task, not one for each participant.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B24. Update user average rating ? PARTIAL

provider_ratings view computes provider average/count. No equivalent requester rating aggregate exists because reciprocal ratings are absent.

Source: [supabase/migrations/202609260001_initial_schema.sql](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations/202609260001_initial_schema.sql).

### B25. Transactions and totals ? PRESENT WITH LIMITS

get_my_transactions returns participant-scoped history. UI computes earned/spent totals. Received-review semantics need correction if both participants are to be rated; no separate totals API is present.

Source: [components/transactions/TransactionsScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/transactions/TransactionsScreen.jsx).

### B26. Tracking consent with timestamp ? MISSING

No tracking-consent table or save/revoke API found.

Source: [supabase/migrations](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations).

### B27. Receive GPS updates every few seconds ? MISSING

No repeated doer-location capture/upload loop or tracking endpoint found. getCurrentPositionAsync is one-shot browsing location.

Source: [context/LocationContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/LocationContext.jsx).

### B28. Store latest position only ? MISSING

Saved browsing location is not a task-scoped live-position record. No latest-position upsert model found.

Source: [supabase/migrations](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations).

### B29. Realtime location to requester ? MISSING

No task tracking channel, realtime subscription, or participant-scoped tracking delivery found.

Source: [context/SuyoContext.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/context/SuyoContext.jsx).

### B30. ETA and remaining distance ? MISSING

Tracking ETA/progress are hardcoded. General straight-line helpers do not implement remaining-route distance or travel ETA.

Source: [components/maps/MapScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/maps/MapScreen.jsx).

### B31. Detect arrival ? MISSING

No destination-radius arrival detection tied to an active task found.

Source: [components/fulfillment/FulfillScreen.jsx](C:/Users/markj/Desktop/cce106/suyolink-app/components/fulfillment/FulfillScreen.jsx).

### B32. Reject updates after task end ? MISSING

No tracking write endpoint or policy exists to enforce task-end rejection.

Source: [supabase/migrations](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations).

### B33. Delete live location after task end ? MISSING

No live-tracking records, cleanup trigger/job, or teardown lifecycle found.

Source: [supabase/migrations](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations).

### Optional backend. Realtime chat / participant access / unread counts ? MISSING

No conversations/messages schema, APIs, participant authorization, realtime delivery, or unread tracking found.

Source: [supabase/migrations](C:/Users/markj/Desktop/cce106/suyolink-app/supabase/migrations).

## Suggested implementation order

1. Remove private values from public fields, separate public area from exact address in the form, require an explicit pin, and review previously stored data for the same leakage.
2. Route dashboard actions to the existing Supabase-backed detail/proof/review/rating/transaction flows. Replace preview records and local-only mutations with persisted data and APIs.
3. Decide direct acceptance versus requester-approved applications; specify who can cancel at each state. Align UI, RPCs, notifications, and tests with that decision.
4. Implement reciprocal ratings with per-task/per-reviewer uniqueness and correct received-review queries; expose all requested sort options and server-side radius filtering.
5. Complete location permission skipping and address fallback, then implement device push notifications.
6. Build task-scoped tracking consent and authorization before GPS upload/realtime/ETA/arrival. Include update rejection and cleanup on completion/cancellation in the first tracking implementation.
7. Add chat last if the optional scope is accepted.

## Audit limits

- No application behavior or database schema was changed during this audit.
- The follow-up inspected the user-supplied live schema export; migration history, real user records, SMTP/OTP configuration, and native device permissions were not inspected.
- ?Encrypted ID storage? needs a definition: native session tokens already use SecureStore; government identity documents do not have an implemented workflow.
- Existing migrations use profiles linked to Supabase Auth users, not a separate custom password database. That is an implementation choice, not a missing users table.
