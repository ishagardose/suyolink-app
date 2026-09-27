# Task workflow

## Database setup

Apply migrations in filename order. Existing projects with the first two migrations only need `supabase/migrations/202609270001_defer_points.sql`. It keeps task history and notifications while stopping new points awards, without deleting earlier ledger records. No messaging or points UI is included.

The app uses the original schema's authenticated RPCs and private `suyo-proofs` bucket. Client controls reflect the current role; PostgreSQL independently validates ownership, deadlines, status transitions, duplicate applications and ratings, and proof access. Do not rerun the initial schema on an existing project.

## Using tasks

- Open a task from a dashboard card or map, then apply. Owners cannot apply to their own tasks. Applicants can withdraw a pending application. A withdrawn or rejected application cannot be resubmitted under the current database rules.
- My Suyos separates posted requests, applications, and assigned work, with active/completed/cancelled filters. Requesters approve one applicant; other pending applicants are rejected atomically.
- Assigned providers start work and select a JPEG, PNG, or WebP completion image up to 10 MB. The image uploads privately before the proof is submitted. A failed proof submission retains the uploaded path for retry.
- Requesters approve completion or request changes with a reason. Rejection returns the task to In progress. Only the requester can rate the provider after completion, once per request.
- Activity shows completed and cancelled work. Individual tasks show chronological status records, newest first. Completed offer amounts represent agreed offers, not processed payments.
- Owners may cancel open requests. Cancellation after assignment requires a policy and is not supported by the existing workflow.

## Notifications and refresh

Notifications is an in-app inbox with an unread indicator and links to requests. Opening an item marks it read. Data refreshes every 30 seconds while the app is active, when returning to the app, after a workflow action, or from the refresh buttons. This release does not send OS push notifications; the previous nonfunctional push switch has been removed.

## Location and deadlines

Expo Location requests foreground permission after sign-in and obtains the device's position. Post a Suyo uses it as the initial pin without replacing a manually chosen pin. Denied permission or a timeout leaves manual selection available. Web location requires HTTPS or localhost. Native Android map builds still require the Maps SDK key described in `request-locations.md`.

The deadline field uses the browser calendar/time control on web and the native date/time picker on Android/iOS. Quick choices set one hour, three hours, or tomorrow (24 hours from now). Dates are selected in device-local time, checked for calendar validity and future time, and stored in UTC.

## Verification

`npm test` runs model/geo checks and the migrations against PGlite with Auth/Storage stubs. `npm run test:e2e` exports a test web build and runs Playwright with mocked Supabase responses. Install Playwright Chromium, or set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge browser. Browser tests exercise task actions, proof upload, approval, ratings, notifications, filters, GPS selection, permission denial, deadlines, authentication, and themes.

Android/iOS bundle exports verify module compatibility, not device behavior. Rebuild native apps for the new image picker and date picker plugins. Verify with two real Supabase accounts and a phone after applying migrations; the automated tests do not deploy migrations or exercise a hosted database.

All list queries currently use the Supabase API row limit. Server pagination and spatial queries are needed before growing beyond that limit.

References: [Expo SDK 54 Location](https://docs.expo.dev/versions/v54.0.0/sdk/location/), [ImagePicker](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/), [Date/time picker](https://docs.expo.dev/versions/v54.0.0/sdk/date-time-picker/).
