# SuyoLink

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
- Configure confirmation and recovery emails using [the email setup guide](docs/email-verification.md) and templates in `docs/emails/`.

The backend includes public profiles, private profile contacts, task requests and private task details, applications, proofs, ratings, notifications, task history, and tracking data. Workflow changes go through authorized RPCs; row-level security restricts access. Proof images use the private `suyo-proofs` bucket.

`supabase/README.md` documents the initial backend stage. Some integration notes there describe historical behavior; use the deployment guide and current migrations for subsequent changes.

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

- Dashboard edit, reward boost, cancel, and repost handlers still change local state and need backend integration. Their UI feedback should not be treated as confirmation of a saved database change.
- Some dashboard display fallbacks remain; the cleanup has not removed every placeholder across every screen.
- Device push requires an EAS project, platform credentials, a deployed worker, and scheduling. Web uses the in-app inbox.
- No payment collection, escrow, cash-out, chat, or identity-document verification is implemented.
- Physical-device GPS and the complete hosted workflow still need manual validation.

