# Email verification codes

Signup opens `/verify-email` with the email address filled in. The user enters the emailed code in the app. `supabase.auth.verifyOtp({ email, token, type: 'email' })` confirms the email and creates a session. Success stays open until the user presses Continue to dashboard. Password login remains unchanged.

## Required Supabase dashboard setup

1. In Authentication, open the Email provider settings and keep Confirm email enabled.
2. Open Authentication > Email Templates > Confirm signup (under Emails in some dashboard layouts).
3. Set the subject to: Your SuyoLink verification code.
4. Replace the body with `docs/emails/confirm-signup.html`, then save. It displays `{{ .Token }}` instead of a link. Editing the local file does not update hosted Supabase automatically.
5. Sign up or resend in the app to receive a fresh email. Previously sent emails do not change.

You can customize the HTML, colors, and branding. Keep `{{ .Token }}` intact. No migration, extra environment variable, or redirect URL is needed for code verification. Site URL and redirect settings can remain for other auth flows; this flow does not use them. Previously issued verification links remain supported by the app.

The input accepts numeric codes from 6 to 10 digits. Supabase enforces code expiry, one-time use, and request limits. The app adds a 60-second resend cooldown.

## Manual check

Create an account in Expo Go or an installed build. Read the email, return to the app, and enter the code. Confirm success, continue to the dashboard, and restart to check session persistence. Also test an invalid code and resend. No browser handoff is needed.

Browser tests simulate Supabase and do not validate real email delivery or dashboard settings.

References: https://supabase.com/docs/guides/auth/auth-email-templates and https://supabase.com/docs/reference/javascript/auth-verifyotp

## Password recovery

The login screen now has Forgot password and Verify email / resend code actions. A login rejected with email_not_confirmed opens verification with the email prefilled. Signup requires matching passwords.

In Supabase Authentication > Email Templates > Reset password, set the subject to Your SuyoLink password reset code and paste docs/emails/reset-password.html as the body. Save before testing. The template must include {{ .Token }}. Editing this local file does not update Supabase.

Recovery sends resetPasswordForEmail, verifies the entered code with type recovery, then updates the password. It uses a separate in-memory client so the recovery session does not replace the app session or automatically unlock the dashboard. The user returns to login after success. Restarting during recovery requires verifying a fresh code. Supabase enforces configured password requirements and token expiry.

No database migration or additional environment variables are needed. Test live email delivery and old/new-password login against your Supabase project after updating the template.
