const { test, expect } = require('@playwright/test');
const { mockSupabase, storageKey } = require('./supabase-fixture.cjs');

test('email code signs in without a redirect and persists after refresh', async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await page.goto('/verify-email?email=requester%40example.com');
  await page
    .getByRole('textbox', { name: 'Verification code', exact: true })
    .fill('012345');
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();
  await expect(
    page.getByText("You're all set!", { exact: true }),
  ).toBeVisible();
  expect(
    calls.find((call) => call.path === '/auth/v1/verify').body,
  ).toMatchObject({
    email: 'requester@example.com',
    token: '012345',
    type: 'email',
  });
  expect(
    await page.evaluate((key) => !!localStorage.getItem(key), storageKey),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByText("You're all set!", { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continue to dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test('invalid code stays signed out and resend allows retrying', async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await page.goto('/verify-email?email=requester%40example.com');
  const input = page.getByRole('textbox', {
    name: 'Verification code',
    exact: true,
  });
  await input.fill('123');
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();
  await expect(
    page.getByText('Enter the complete numeric code from your email.'),
  ).toBeVisible();
  expect(calls.some((call) => call.path === '/auth/v1/verify')).toBe(false);
  await input.fill('999999');
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();
  await expect(
    page.getByText('This code is invalid or has expired.', { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBeNull();
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await expect(
    page.getByText('a new code is on its way', { exact: false }),
  ).toBeVisible();
  await expect(input).toHaveValue('');
  expect(
    new URLSearchParams(
      calls.find((call) => call.path === '/auth/v1/resend').query,
    ).has('redirect_to'),
  ).toBe(false);
  await input.fill('012345');
  await page.getByRole('button', { name: 'Verify email', exact: true }).click();
  await expect(
    page.getByText("You're all set!", { exact: true }),
  ).toBeVisible();
});

function verificationURL() {
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ exp: Math.floor(Date.now() / 1000) + 3600, sub: '11111111-1111-4111-8111-111111111111' })}.test-signature`;
  return `/verify-email#access_token=${token}&refresh_token=test-refresh-token&type=signup`;
}

test('confirmation link signs in, stays on success screen and restores after refresh', async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(verificationURL());
  await expect(
    page.getByText("You're all set!", { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/verify-email$/);
  expect(calls.some((call) => call.path === '/auth/v1/user')).toBe(true);
  expect(
    await page.evaluate((key) => !!localStorage.getItem(key), storageKey),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByText("You're all set!", { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continue to dashboard' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(errors).toEqual([]);
});

test('expired links keep dashboard locked and offer a resend', async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await page.goto('/verify-email#error=access_denied&error_code=otp_expired');
  await expect(
    page.getByText('This verification link has expired', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continue to dashboard' }),
  ).toHaveCount(0);
  await page
    .getByRole('textbox', { name: 'Verification email address' })
    .fill('new@example.com');
  await page.getByRole('button', { name: 'Resend verification email' }).click();
  await expect(
    page.getByText('If this account still needs verification', {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    calls.find((call) => call.path === '/auth/v1/resend').body,
  ).toMatchObject({ type: 'signup', email: 'new@example.com' });
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/$/);
});

test('a rejected token cannot produce a success screen', async ({ page }) => {
  await mockSupabase(page);
  await page.route('**/auth/v1/user', (route) =>
    route.fulfill({ status: 401, json: { message: 'Invalid token' } }),
  );
  await page.goto(verificationURL());
  await expect(
    page.getByText('We could not sign you in from this link.', {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByText("You're all set!", { exact: true })).toHaveCount(
    0,
  );
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBeNull();
});

test('visiting verification without credentials does not log in', async ({
  page,
}) => {
  await mockSupabase(page);
  await page.goto('/verify-email?verified=true');
  await expect(
    page.getByText('Check your email', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Continue to dashboard' }),
  ).toHaveCount(0);
});
