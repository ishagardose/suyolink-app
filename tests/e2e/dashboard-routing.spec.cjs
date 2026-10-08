const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('the app entry opens the chosen dashboard in the main route group', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.goto('/');
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText('Available Suyos', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Open sidebar', exact: true }),
  ).toBeVisible();
});

test('the dashboard deep link requires a saved browsing location', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/set-location$/);
  await expect(
    page.getByRole('button', { name: 'Find nearby suyos', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Available Suyos', { exact: true })).toHaveCount(
    0,
  );
});

test('the dashboard deep link is protected for signed out users', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: false });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Available Suyos', { exact: true })).toHaveCount(
    0,
  );
});
