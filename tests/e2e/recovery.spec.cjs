const { test, expect } = require('@playwright/test');
const { mockSupabase, storageKey } = require('./supabase-fixture.cjs');

test('signup rejects mismatched passwords before sending a request', async ({ page }) => {
  const calls = await mockSupabase(page, { confirmation: true });
  await page.goto('/signup');
  await page.getByLabel('Full Name', { exact: true }).fill('New User');
  await page.getByLabel('Email Address', { exact: true }).fill('new@example.com');
  await page.getByLabel('Password', { exact: true }).fill('new-password');
  await page.getByLabel('Confirm Password', { exact: true }).fill('different-password');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  expect(calls.some(call => call.path === '/auth/v1/signup')).toBe(false);
});

test('login routes unconfirmed accounts to code entry', async ({ page }) => {
  await mockSupabase(page);
  await page.route('**/auth/v1/token**', route => route.fulfill({ status: 400,
    headers: { 'x-supabase-api-version': '2024-01-01', 'access-control-expose-headers': 'x-supabase-api-version' },
    json: { code: 'email_not_confirmed', msg: 'Email not confirmed' } }));
  await page.goto('/login');
  await page.getByLabel('Email Address', { exact: true }).fill('requester@example.com');
  await page.getByLabel('Password', { exact: true }).filter({ visible: true }).fill('old-password');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByLabel('Verification code', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Verification email address')).toHaveValue('requester@example.com');
});

test('recovery verifies a code before changing password and never persists its session', async ({ page }) => {
  const calls = await mockSupabase(page);
  await page.goto('/login');
  await page.getByLabel('Email Address', { exact: true }).fill('requester@example.com');
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByRole('button', { name: 'Send reset code', exact: true }).click();
  await expect(page.getByText('If this email has an account', { exact: false })).toBeVisible();
  expect(calls.find(call => call.path === '/auth/v1/recover').body.email).toBe('requester@example.com');
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await page.getByLabel('Reset code', { exact: true }).fill('999999');
  await page.getByRole('button', { name: 'Verify reset code' }).click();
  await expect(page.getByText('This code is invalid or expired.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
  await page.getByLabel('Reset code', { exact: true }).fill('012345');
  await page.getByRole('button', { name: 'Verify reset code' }).click();
  await expect(page.getByText('Choose a new password', { exact: true })).toBeVisible();
  expect(calls.filter(call => call.path === '/auth/v1/verify').every(call => call.body.type === 'recovery')).toBe(true);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByLabel('New password', { exact: true }).fill('new-password');
  await page.getByLabel('Confirm new password', { exact: true }).fill('different');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  expect(calls.some(call => call.path === '/auth/v1/user' && call.body?.password)).toBe(false);
  await page.getByLabel('Confirm new password', { exact: true }).fill('new-password');
  await page.getByRole('button', { name: 'Save new password' }).click();
  await expect(page.getByText('Password updated', { exact: true })).toBeVisible();
  expect(calls.find(call => call.path === '/auth/v1/user' && call.body?.password).body.password).toBe('new-password');
  expect(await page.evaluate(() => Object.keys(localStorage).some(key => key.includes('password-recovery')))).toBe(false);
  await page.getByRole('button', { name: 'Back to login' }).click();
  await expect(page).toHaveURL(/\/login$/);
});
