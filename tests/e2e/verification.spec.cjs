const { test, expect } = require('@playwright/test');
const { mockSupabase, storageKey } = require('./supabase-fixture.cjs');

function verificationURL() {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600, sub: '11111111-1111-4111-8111-111111111111' })}.test-signature`;
  return `/verify-email#access_token=${token}&refresh_token=test-refresh-token&type=signup`;
}

test('confirmation link signs in, stays on success screen and restores after refresh', async ({ page }) => {
  const calls = await mockSupabase(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(verificationURL());
  await expect(page.getByText("You're all set!", { exact: true })).toBeVisible();
  await expect(page).toHaveURL('http://127.0.0.1:4173/verify-email');
  expect(calls.some(call => call.path === '/auth/v1/user')).toBe(true);
  expect(await page.evaluate(key => !!localStorage.getItem(key), storageKey)).toBe(true);
  await page.reload();
  await expect(page.getByText("You're all set!", { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(errors).toEqual([]);
});

test('expired links keep dashboard locked and offer a resend', async ({ page }) => {
  const calls = await mockSupabase(page);
  await page.goto('/verify-email#error=access_denied&error_code=otp_expired');
  await expect(page.getByText('This verification link has expired', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to dashboard' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Verification email address' }).fill('new@example.com');
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await expect(page.getByText('If this account still needs verification', { exact: false })).toBeVisible();
  expect(calls.find(call => call.path === '/auth/v1/resend').body).toMatchObject({ type: 'signup', email: 'new@example.com' });
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await page.goto('/dashboard');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
});

test('a rejected token cannot produce a success screen', async ({ page }) => {
  await mockSupabase(page);
  await page.route('**/auth/v1/user', route => route.fulfill({ status: 401, json: { message: 'Invalid token' } }));
  await page.goto(verificationURL());
  await expect(page.getByText('We could not sign you in from this link.', { exact: false })).toBeVisible();
  await expect(page.getByText("You're all set!", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
});

test('visiting verification without credentials does not log in', async ({ page }) => {
  await mockSupabase(page);
  await page.goto('/verify-email?verified=true');
  await expect(page.getByText('Check your email', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue to dashboard' })).toHaveCount(0);
});
