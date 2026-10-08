const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('doer status tabs scroll on a narrow phone and remain selectable', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await mockSupabase(page, { signedIn: true });
  await page.goto('/dashboard');
  await page.getByText('Doer Suyo', { exact: true }).click();
  const tabs = page.getByTestId('doer-status-tabs');
  await expect(tabs).toBeVisible();
  expect(await tabs.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  await tabs.hover();
  await page.mouse.wheel(500, 0);
  await expect
    .poll(() => tabs.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(0);
  await page.getByRole('tab', { name: /Cancelled/ }).click();
  await expect(
    page.getByText('Cancelled Suyos', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: /Completed/ }).click();
  await expect(
    page.getByText('Completed Suyos', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: /Accepted/ }).click();
  await expect(page.getByText('Accepted Suyos', { exact: true })).toBeVisible();
});
