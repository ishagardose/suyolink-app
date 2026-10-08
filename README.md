# SuyoLink
<p align="center">
  <img src="./assets/suyolink_logo.png" alt="SuyoLink logo" width="180" />
</p>


[Download](https://github.com/ishagardose/suyolink-app/releases/download/1.0.0/suyolink-1.0.0.apk) the APK, open it on your Android phone, and allow installation
from your browser or file manager if prompted.

SuyoLink is a community task app for posting requests, finding nearby tasks, coordinating fulfillment, and reviewing completed work. It runs on Android, iOS, and web using Expo and Supabase.

## Technology

- Expo SDK 54, React Native 0.81, and React 19.
- Expo Router for navigation and protected route groups.
- Supabase Auth, PostgreSQL with row-level security, private Storage, Realtime, and Edge Functions.
- React Native Maps on mobile and Leaflet on web.
- Playwright for browser tests and PGlite for local database tests.

Use the [Expo SDK 54 documentation](https://docs.expo.dev/versions/v54.0.0/) when working on this project.

## Getting started

Install Node.js and npm compatible with Expo SDK 54, then install the locked dependencies:

```sh
npm ci
```

Create a local `.env` from `.env.example`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set the values for your Supabase project:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

Use a public anon or publishable key in the app. Service-role keys and push-worker secrets belong on the server. `.env` is ignored by Git.

The backend must have the matching migrations applied before using the app. See [Backend setup](#backend-setup) below.

Start the development server:

```sh
npm start
```

Open the app through Expo Go or a development build. To start the web app directly:

```sh
npm run web
```

For local native builds, use `npm run android` or `npm run ios` with the appropriate native development tools installed. Local iOS builds require macOS and Xcode. For your own Android map build, configure `GOOGLE_MAPS_API_KEY` as described in `.env.example` and rebuild the native app.

Restart Expo after changing environment variables. Changes to native plugins or build configuration require a new native build.

## Main flows

- **Account access:** signup, email verification codes, password login, password recovery, session restoration, and logout.
- **Location setup:** signed-in users must select an area and acknowledge the location notice before entering protected features. GPS permission can be denied; manual map selection remains available. Changing the selected pin resets acknowledgment.
- **Post a Suyo:** enter task details, reward offer, completion deadline, public area, and a chosen map pin. Exact directions and contact details are kept separate from the public task area.
- **Find and fulfill tasks:** browse database records, open a task, and use its persisted application or acceptance actions. The assigned doer starts work and submits proof; the requester reviews proof to confirm completion.
- **Manage requests:** save edits and reward boosts for open, unexpired posts, cancel through the task workflow, or repost using a prefilled form with a fresh deadline. Changes to published tasks persist in Supabase.
- **Profiles:** account details, reviews, and completed-task statistics load from Supabase. Profile edits persist to the backend; email is read-only in the profile editor.
- **Notifications:** the dashboard inbox loads real notification records and supports marking them read and removing them. Device push requires separate deployment and native credentials.
- **Appearance:** light, dark, and system appearance preferences are supported.
- **Wallet and activity:** task transaction history and earned/spent summaries are displayed. These are task records, not a payment-processing service.

The current dashboard design lives in `components/dashboard/`. The previous `legacy` naming has been removed; there is one dashboard screen shared by its route.

## Live mapping

The `/map` route shows task locations and participant tracking. Live sharing starts only when the assigned doer explicitly enables it and grants foreground location permission.

- Only task participants can read live positions.
- Sharing stops when leaving the tracking screen or moving the app into the background.
- Proof submission, cancellation, and completion revoke sharing through the backend workflow.
- Realtime updates have a polling fallback, and positions older than 30 seconds are hidden.
- Distance and ETA are straight-line estimates. Background tracking and road navigation are not implemented.

See the [map implementation guide](components/maps/README.md) for platform-specific files and integration details.

## Project structure

```text
app/                     Expo Router entries and route guards
  (auth)/                Login, signup, verification, and recovery
  (onboarding)/          Welcome and required area setup
  (main)/                Dashboard and map
  (requests)/            Posting, task details, fulfillment, proof, and rating
  (account)/             Account and public profile routes
  (wallet)/              Wallet, activity, and transactions
components/              Feature screens, sections, dialogs, and shared UI
  dashboard/             Dashboard composition, tabs, hooks, styles, and inbox
  requests/              Request form, field sections, and location/deadline pickers
  maps/                  Map screen and native/web map renderers
  fulfillment/           Fulfillment screens and participant-location helpers
  account/               Account editor, profile data, and reviews
  wallet/                Activity screen, transaction UI, and income chart
context/                 Auth, saved browsing location, and task state
data/                    Supabase adapters and domain validation
hooks/                   Shared hooks, including live task tracking
lib/                     Storage, GPS, proof uploads, push, and formatting helpers
theme/                   Theme context, colors, and palette adapters
supabase/                SQL migrations, deployment guide, and push worker
tests/                   Unit, database policy/workflow, and browser tests
docs/                    Feature notes, email templates, and device checklists
```

Keep route files small. Put feature behavior in the matching component folder, backend access in `data/` or the relevant context, and shared platform helpers in `lib/`. See the [dashboard folder guide](components/dashboard/README.md) for its internal organization.

## Backend setup

Use the existing Supabase project and inspect its migration history before making schema changes. Editing a local SQL file does not apply it to the hosted database.

- For a fresh schema, apply the files in `supabase/migrations/` in filename order.
- For an existing project, identify which migrations are already applied and review the remaining changes before running them. Do not rerun the initial schema over an existing database.
- Follow [the deployment guide](supabase/DEPLOYMENT.md) for existing-project upgrades, privacy changes, tracking, profile support, and push-worker configuration. Its notification section covers `202610080002_notification_deletion.sql`.
- Apply `202610090001_dashboard_task_actions.sql` for dashboard editing and reward boosts. See [dashboard task actions](supabase/DEPLOYMENT.md#dashboard-task-actions) for permissions and reward behavior.
- Configure confirmation and recovery emails using [the email setup guide](docs/email-verification.md) and templates in `docs/emails/`.

The backend includes public profiles, private profile contacts, task requests and private task details, applications, proofs, ratings, notifications, task history, and tracking data. Workflow changes go through authorized RPCs; row-level security restricts access. Proof images use the private `suyo-proofs` bucket.

`supabase/README.md` documents the initial backend stage. Some integration notes there describe historical behavior; use the deployment guide and current migrations for subsequent changes.

## Database tables

This inventory describes the 16 application tables defined by the repository migrations, including `202610090001_dashboard_task_actions.sql`. Your hosted database matches this structure only after the corresponding migrations have been applied. All tables below are in the `public` schema; row-level security and authorized RPCs control access.

### Accounts and saved area

- **`profiles`**: public identity for signed-in users. Key fields: `id`, `full_name`, `handle`, `bio`, and timestamps. `id` references `auth.users.id`; completed counts and average ratings are calculated rather than hardcoded profile fields.
- **`profile_contacts`**: private default phone and address. Key fields: `user_id`, `phone`, `address`, and `updated_at`. Each user has one contact row, readable and editable by its owner.
- **`profile_last_locations`**: private saved browsing area. Key fields: `user_id`, `latitude`, `longitude`, `source`, and `updated_at`. This is the user's saved area, separate from live task tracking.

### Tasks and fulfillment

- **`suyo_requests`**: task records. Key fields: `id`, `requester_id`, `provider_id`, `title`, `details`, `category`, `offer_centavos`, `reward_boost_centavos`, `deadline`, `location`, `notes`, `status`, approximate coordinates, `client_reference`, and timestamps. Requester/provider IDs reference `profiles`; the client reference prevents duplicate creation when retrying the same post.
- **`request_private_details`**: exact task address, exact pin, and task contact phone. Key fields: `request_id`, `exact_address`, `exact_latitude`, `exact_longitude`, and `contact_phone`. There is one row per task; access depends on the viewer's role and task status.
- **`applications`**: doer applications to tasks. Key fields: `id`, `request_id`, `applicant_id`, `message`, `status`, `created_at`, and `decided_at`. A user can have one application per task, and at most one application can be accepted for a task.
- **`proofs`**: submitted completion evidence and review state. Key fields: `id`, `request_id`, `provider_id`, `storage_path`, `note`, `status`, `rejection_reason`, and review timestamps. Images live in private Storage; this table stores their paths and workflow metadata.
- **`ratings`**: reviews exchanged by participants after completion. Key fields: `id`, `request_id`, `reviewer_id`, `provider_id`, `score`, `comment`, and `created_at`. `provider_id` is the review recipient for compatibility with the original schema. Scores range from 1 to 5, with one review per participant per task.
- **`request_events`**: append-only task status history. Key fields: `id`, `request_id`, `actor_id`, `from_status`, `to_status`, and `created_at`. Workflow functions generate these records.
- **`transactions`**: one completion record per task for participant history and earned/spent summaries. Key fields: `id`, `request_id`, `requester_id`, `provider_id`, `reward_centavos`, `currency`, and `completed_at`. This is not a payment-provider ledger.

Offers, boosts, and transaction rewards use integer centavos: `15000` represents PHP 150.00. The total offer includes its selected boost; resetting the boost restores the base offer.

### Notifications and device push

- **`notifications`**: each recipient's private in-app inbox. Key fields: `id`, `recipient_id`, `request_id`, `kind`, `body`, `read_at`, and `created_at`. Users can mark their own notifications read and delete them; workflow functions generate notification content.
- **`push_tokens`**: registered Expo device tokens. Key fields: `token`, `user_id`, and timestamps. Token registration/removal uses the authenticated push RPCs.
- **`push_outbox`**: server-managed delivery queue. Key fields: `id`, `notification_id`, `token`, `attempts`, `available_at`, `sent_at`, `ticket_id`, and `last_error`. The trusted push worker processes this table; app clients cannot read or write the queue directly.

### Live location sharing

- **`tracking_consents`**: the assigned doer's sharing consent for a task. Key fields: `request_id`, `provider_id`, `consented_at`, and `revoked_at`. There is one consent record per task.
- **`live_locations`**: the latest shared task position. Key fields: `request_id`, `provider_id`, `latitude`, `longitude`, `accuracy`, `speed`, `arrived`, and `updated_at`. It stores the latest position, not a full GPS trail; participant access follows tracking consent and task state.

### Retained points data

- **`points_ledger`**: historical achievement-point entries linked to users and tasks. Points were deferred by `202609270001_defer_points.sql`; existing entries are retained, but the current completion workflow does not award new points. Points are not a cash balance.

### Related views and Supabase-managed storage

- **`provider_ratings`** is a view that aggregates ratings received; **`my_points`** is a view over retained point entries. They are views, not additional tables.
- **`auth.users`** belongs to Supabase Auth and holds account identities. Passwords are not stored in `profiles`.
- **`storage.buckets`** and **`storage.objects`** belong to Supabase Storage. The private **`suyo-proofs`** bucket stores completion images.

The common relationship is `profiles` → `suyo_requests` → applications, proofs, ratings, history, transactions, and tracking records. Private account contacts and saved browsing areas link directly to `profiles`. Full column definitions, constraints, policies, and RPCs are maintained in [the migrations](supabase/migrations/).

## Testing

Run unit tests and local database policy/workflow checks:

```sh
npm test
```

Run all browser tests:

```sh
npm run test:e2e
```

The browser runner builds the web app against a fake Supabase URL and intercepts requests. It does not create real accounts, send emails, or update the hosted database. It uses installed Chrome by default. On Windows with Edge, select it before running tests:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

Run selected browser specs by passing their filenames:

```sh
npm run test:e2e -- dashboard-profile.spec.cjs signup-location.spec.cjs verification.spec.cjs live-tracking.spec.cjs request-form-appearance.spec.cjs
```

The latest debug pass passed 50 targeted browser checks covering appearance, notifications, component boundaries, profile persistence, route protection, tracking, recovery, request layouts, location setup, and verification. Unit/database checks and web, Android, and iOS exports also passed. The full browser suite still has unresolved failures, including tests written for previous UI and workflow behavior; a targeted pass does not mean the entire suite is green.

Test exports in `dist/` use the fake backend. Rebuild with your real environment before deployment. Browser mocks and successful bundles do not verify hosted email delivery, device push, native GPS permissions, or physical-device tracking. Use the [Android device checklist](docs/demo/android-expo-go-checklist.md) alongside a real-project smoke test.

## Known limitations

- Archived templates are session-local drafts; they are not saved to the database.
- Some dashboard display fallbacks remain; the cleanup has not removed every placeholder across every screen.
- Device push requires an EAS project, platform credentials, a deployed worker, and scheduling. Web uses the in-app inbox.
- No payment collection, escrow, cash-out, chat, or identity-document verification is implemented.
- Physical-device GPS and the complete hosted workflow still need manual validation.


## Mobile fixes and build notes


Expo SDK 54, Expo Router, React Native, and Supabase.

## Structure

- `app/`: small route entries organized into `(auth)`, `(main)`, `(requests)`, `(account)`, `(wallet)`, and `(onboarding)` groups. Parenthesized groups preserve existing URLs.
- `components/`: feature screens and reusable form, map, proof, rating, transaction, and themed components.
- `components/account/`: profile card, reviews, edit modal, data/summary hooks, formatting helpers, and theme styles. `AccountScreen` composes these sections.
- `components/dashboard/`: the single dashboard design at `/dashboard`, composed from tabs, task cards/lists, navigation, dialogs, hooks, and feature styles. See its README for the folder guide.
- `components/fulfillment/`: fulfillment screens, tracking timelines, proof dialog, location hook, and styles. Route entries remain in `app/(requests)/`.
- `components/requests/`: request form composition, field sections, attachment hook, configuration, pickers, and success dialog.
- `components/wallet/chart/`: income calculations, web/native chart rendering, and chart styles. `WalletIncomeLineGraph` composes these pieces.
- `components/requests/RequestForm.styles.js` and `components/wallet/activity.styles.js`: styles extracted from the posting form and wallet activity screen.
- `context/`: authentication, saved browsing location, and persisted task workflows.
- `data/`: Supabase RPC adapters and domain validation. No production preview dataset.
- `hooks/useTaskTracking.js`: foreground GPS consent, position updates, and live subscriptions.
- `lib/`: authentication storage, proof upload, distance helpers, and platform-specific push registration.
- `supabase/migrations/`: schema, authorization, workflows, tracking, and push queue.
- `supabase/functions/send-push/`: scheduled Expo push sender and receipt handling.
- `tests/`: domain, PostgreSQL policy/workflow tests, and mocked browser checks.

Dashboard lists, notifications, profiles/reviews, and transaction totals come from Supabase. Fulfillment screens load the selected task, show its completion deadline in local time, and use the shared proof submission and requester approval workflows. Both wallet entry points use `components/wallet/WalletScreen.jsx`; rewards come only from `get_my_transactions`, with visible loading, error, and retry states. These are agreed rewards for confirmed tasks, not a cash balance or proof of payment. Authentication is required; location setup can be skipped, while posting requires a chosen pin.

The `/map` route uses the real task map. Web uses OpenStreetMap tiles; Android uses Google Maps and requires `GOOGLE_MAPS_API_KEY` at build time. Enable Maps SDK for Android and restrict the key to the APK's package name and signing certificate SHA-1. A working web map does not verify the Android key. Never commit `.env` or signing credentials. Rebuild the APK after changing configuration or source code.

## Dashboard actions

Task edit, reward boost, cancellation, and repost drafts use the backend integration and migrations included in this revision. Archived templates and favorites remain session-local. Apply the dashboard task actions migration before testing against your hosted project.

## Run and verify

```sh
npm ci
npm start
npm test
npm run test:e2e -- dynamic.spec.cjs
npm run test:e2e -- wallet-fulfillment-map appearance profile-backend dashboard-routing
```

The browser runner builds against a fake Supabase URL and intercepts requests. Older browser specs describe previous UI layouts and are not the acceptance suite for the redesigned dashboard.

Read [the deployment instructions](supabase/DEPLOYMENT.md) before using these features against a hosted project. Apply migrations in order and configure the push worker/EAS credentials separately. Tracking is foreground-only.

Task maps fetch a driving route from OSRM using the doer and task coordinates, draw the returned road geometry, and show route distance and estimated time without live traffic. Routes refresh at most every 30 seconds as coordinates change; explicit retries wait at least one second. Missing or failed routes show an error instead of a straight line. Route calculation needs an internet connection.

`EXPO_PUBLIC_ROUTING_URL` selects an OSRM-compatible server (base URL, without `/route/v1`). The default `https://router.project-osrm.org` is a public demo limited to reasonable, non-commercial testing, with no availability guarantee; use your own server or a provider suitable for your usage before a commercial/public-scale deployment. See the [OSRM demo policy](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server). The routing server receives both coordinates; the sharing notice states this. OSRM routing uses no Google Directions/Routes API key. Rebuild the APK after changing the routing URL.
