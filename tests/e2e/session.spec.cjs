const { test, expect } = require('@playwright/test');
const { light, dark } = require('../../theme/colors.js');
const rgb = (hex) => `rgb(${hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16)).join(', ')})`;
const SESSION = '@suyolink/mock-user';
const THEME = '@suyolink/theme';
const errors = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (error) => errors.push(error.message));
});
test.afterEach(() => expect(errors).toEqual([]));

async function login(page) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('demo@example.com');
  await page.getByLabel('Password', { exact: true }).fill('local-demo');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('WELCOME BACK', { exact: true })).toBeVisible();
}
async function sidebar(page) {
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await expect(page.getByText('Appearance', { exact: true })).toBeVisible();
}

test('logged-out dashboard, map and welcome deep links return to the landing page', async ({ page }) => {
  for (const route of ['/dashboard', '/map', '/welcome']) {
    await page.goto(route);
    await expect(page).toHaveURL('http://127.0.0.1:4173/');
    await expect(page.getByText('WELCOME BACK', { exact: true })).toHaveCount(0);
  }
});

test('signup opens welcome, persists only profile data, and logout revokes protected routes', async ({ page }) => {
  await page.goto('/signup');
  await page.getByRole('textbox', { name: 'Full Name', exact: true }).fill('Demo User');
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('  DEMO@example.com ');
  await page.getByLabel('Password', { exact: true }).fill('do-not-store-me');
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByText('Welcome, Demo User!', { exact: true })).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SESSION);
  expect(saved).toEqual({ name: 'Demo User', email: 'demo@example.com', phone: '', address: '' });
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open sidebar' })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  await sidebar(page);
  await page.getByRole('button', { name: 'Log Out', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  expect(await page.evaluate((key) => localStorage.getItem(key), SESSION)).toBeNull();
  await page.goBack();
  await expect(page.getByText('WELCOME BACK', { exact: true })).toHaveCount(0);
  await page.goto('/dashboard');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
});

test('login validates inputs and profile edits survive reload', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByText('Enter a password to continue.')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('invalid');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await login(page);
  await sidebar(page);
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByRole('textbox', { name: 'Full Name', exact: true }).fill('Updated User');
  await page.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('Updated User', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Updated User', { exact: true })).toBeVisible();
});

test('light/dark persist and system mode follows device appearance', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
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

test('corrupt saved sessions fail closed and a storage failure does not log in', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{invalid'), SESSION);
  await page.goto('/dashboard');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await page.goto('/login');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await page.getByRole('textbox', { name: 'Email Address', exact: true }).fill('demo@example.com');
  await page.getByLabel('Password', { exact: true }).fill('demo');
  await page.getByRole('button', { name: 'Log In', exact: true }).click();
  await expect(page.getByText('Storage unavailable')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
