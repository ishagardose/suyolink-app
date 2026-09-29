const { test, expect } = require('@playwright/test');
const { mockSupabase, login, storageKey } = require('./supabase-fixture.cjs');

test('old mock profiles cannot unlock protected routes', async ({ page }) => {
  await mockSupabase(page);
  await page.addInitScript(() => localStorage.setItem('@suyolink/mock-user', JSON.stringify({ email: 'old@example.com', name: 'Old Mock' })));
  for (const path of ['/dashboard', '/map', '/welcome', '/post-suyo']) {
    await page.goto(path);
    await expect(page).toHaveURL('http://127.0.0.1:4173/');
  }
});

test('login submits password, restores session, saves profile and logs out', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const calls = await mockSupabase(page);
  await login(page);
  expect(calls.find(call => call.path === '/auth/v1/token').body).toMatchObject({ email: 'requester@example.com', password: 'correct-test-password' });
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Request Tester', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('textbox', { name: 'Full Name', exact: true }).fill('Updated User');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Updated User', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Updated User', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await page.getByRole('button', { name: 'Log Out', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.goto('/dashboard');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  expect(errors).toEqual([]);
});

test('invalid credentials stay on login and show the server error', async ({ page }) => {
  await mockSupabase(page, { rejectLogin: true });
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('wrong@example.com');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByText('Invalid login credentials', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

for (const confirmation of [true, false]) {
  test(`signup with confirmation ${confirmation}`, async ({ page }) => {
    const calls = await mockSupabase(page, { confirmation });
    await page.goto('/signup');
    await page.getByRole('textbox', { name: 'Full Name', exact: true }).fill('New User');
    await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('new@example.com');
    await page.getByLabel('Password', { exact: true }).fill('new-account-password');
    await page.getByLabel('Confirm Password', { exact: true }).fill('new-account-password');
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    if (confirmation) {
      await expect(page.getByText('Check your email', { exact: false })).toBeVisible();
      await expect(page).toHaveURL(/\/verify-email\?email=/);
      expect(new URLSearchParams(calls.find(call => call.path === '/auth/v1/signup').query).has('redirect_to')).toBe(false);
      await page.goto('/dashboard');
      await expect(page).toHaveURL('http://127.0.0.1:4173/');
    } else {
      await expect(page).toHaveURL(/\/welcome$/);
      await expect(page.getByText('Welcome, New User!', { exact: true })).toBeVisible();
    }
    expect(calls.find(call => call.path === '/auth/v1/signup').body).toMatchObject({ email: 'new@example.com', password: 'new-account-password', data: { full_name: 'New User' } });
  });
}

const { light, dark } = require('../../theme/colors.js');
const rgb = (hex) => `rgb(${hex.slice(1).match(/.{2}/g).map((v) => parseInt(v, 16)).join(', ')})`;
const THEME = '@suyolink/theme';
async function sidebar(page) { await page.getByRole('button', { name: 'Open sidebar' }).click(); }
test('light/dark persist and system mode follows device appearance', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await mockSupabase(page);
  await login(page);
  await sidebar(page);
  await page.getByRole('button', { name: 'dark theme', exact: true }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), THEME)).toBe('dark');
  await expect(page.getByText('Appearance', { exact: true })).toHaveCSS('color', rgb(dark.text));
  await page.reload();
  await sidebar(page);
  await expect(page.getByText('Appearance', { exact: true })).toHaveCSS('color', rgb(dark.text));
  await page.getByRole('button', { name: 'light theme', exact: true }).click();
  await expect(page.getByText('Appearance', { exact: true })).toHaveCSS('color', rgb(light.text));
  await page.getByRole('button', { name: 'system theme', exact: true }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), THEME)).toBe('system');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.getByText('Appearance', { exact: true })).toHaveCSS('color', rgb(dark.text));
});
