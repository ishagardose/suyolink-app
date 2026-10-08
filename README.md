# SuyoLink

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

## Remaining dashboard integration work

This `main` revision still has local-only task edit, reward boost, cancellation, repost, archive, and favorites handlers. Export also displays a notification without creating a statement. These handlers must not be treated as persisted backend actions. The `feat/dashboard-backend-actions` branch contains additional integration work and a corresponding migration; review and integrate that work before releasing those dashboard controls. Profile saves, wallet rewards, and fulfillment proof/status actions use the existing backend.

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
