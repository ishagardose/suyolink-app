# Email verification

Signup now opens `/verify-email` when Supabase requires confirmation. The email link returns to this screen, establishes a Supabase session, and shows **You're all set!**. The user stays there until pressing **Continue to dashboard**. Expired or rejected links show an error and allow resending. Passwords are never passed in links or saved for auto-login.

## Supabase settings (required)

In **Authentication → URL Configuration**, add the addresses you actually use to **Redirect URLs**:

- Web development: `http://localhost:8081/verify-email` (use your actual host and port).
- Production web: `https://YOUR-DOMAIN/verify-email`.
- Installed native/development build: `suyolink-app://verify-email`.
- Expo Go during development: `exp://YOUR-LAN-IP:8081/--/verify-email` (use the current Expo host/port). This address changes with your development environment; use an installed development build for reliable native callback testing.

Keep email confirmation enabled under the email authentication provider. Set **Site URL** to a reachable website. Signup and resend use `Linking.createURL('verify-email')` to supply the platform-specific `emailRedirectTo`. Supabase must allow that exact URL or it may fall back to the Site URL.

Under **Authentication → Email Templates → Confirm signup**, the button must link to `{{ .ConfirmationURL }}`. You can label it **Verify email**. Do not replace it with a direct link to the app: Supabase must verify the email before returning session credentials. A custom template that manually constructs the verification URL should preserve `{{ .RedirectTo }}`.

The browser briefly visits Supabase to validate the email, then opens the app's confirmation screen. This redirect is necessary for automatic sign-in; there is no automatic jump to the dashboard. Opening the link on another device signs in that device, not the original one. Some email browsers require permission to open a native app.

## Test on your project

1. After configuring the URLs, create a new account using an email you can receive.
2. Confirm signup opens the dedicated check-email screen without granting dashboard access.
3. Open the newest email and press **Verify email**.
4. Confirm **You're all set!** appears without another password prompt, then press **Continue to dashboard**.
5. Restart the app to check persistence. Test an expired link and the resend button too.

Browser tests use simulated Supabase responses. They do not validate email delivery, your project's redirect settings, or the operating system opening the native app.

References: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [native deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Expo SDK 54 Linking](https://docs.expo.dev/versions/v54.0.0/sdk/linking/).
