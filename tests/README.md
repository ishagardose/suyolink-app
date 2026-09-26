Run the browser integration checks with:

```sh
npx playwright install chromium
npm run test:e2e
```

To use an installed Microsoft Edge on Windows instead:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

The command exports the Expo web app and serves it locally for Playwright. Tests cover mock login/signup, protected deep links, session restoration, logout, profile editing, theme persistence, and storage failures. They use isolated browser storage and do not contact an authentication backend.
