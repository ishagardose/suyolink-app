const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('legacy dashboard keeps navigation, search, and notifications after extraction', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/dashboard');
  const search = page.getByLabel('Search suyos', { exact: true });
  await search.fill('separation check');
  await page.getByText('MySuyo', { exact: true }).click();
  await page.getByText('Doer Suyo', { exact: true }).click();
  await expect(
    page.getByText('Suyos Done as Doer', { exact: true }),
  ).toBeVisible();
  await page.getByText('Home', { exact: true }).click();
  await expect(search).toHaveValue('separation check');
  await page.getByRole('button', { name: /Open notifications/ }).click();
  await expect(page.getByText('Doer Assigned', { exact: true })).toBeVisible();
  await page.getByText('Done', { exact: true }).click();
  await expect(search).toHaveValue('separation check');
  expect(errors).toEqual([]);
});

test('wallet activity renders after extracting its styles', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/activity');
  try {
    await expect(page.getByText('Wallet', { exact: true })).toBeVisible();
  } finally {
    expect(errors).toEqual([]);
  }
});
