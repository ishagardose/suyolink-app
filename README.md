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

Dashboard lists, notifications, profiles/reviews, and transaction totals come from Supabase. Older fulfillment/proof/rating URLs redirect to the shared persisted workflows. Wallet/activity reuse transaction history. Authentication is required; location setup can be skipped, while posting requires a chosen pin.

## Run and verify

```sh
npm ci
npm start
npm test
npm run test:e2e -- dynamic.spec.cjs
```

The browser runner builds against a fake Supabase URL and intercepts requests. Older browser specs describe previous UI layouts and are not the acceptance suite for the redesigned dashboard.

Read [the deployment instructions](supabase/DEPLOYMENT.md) before using these features against a hosted project. Apply migrations in order and configure the push worker/EAS credentials separately. Tracking is foreground-only and its ETA is based on straight-line distance/current speed.
