const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const { light } = require('../../theme/colors.js');
const rgb = (hex) =>
  `rgb(${hex
    .slice(1)
    .match(/../g)
    .map((part) => parseInt(part, 16))
    .join(', ')})`;

test('profile uses theme surfaces and remains editable after extracting styles', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockSupabase(page, { signedIn: true });
  await page.goto('/account');
  const name = page.getByText('Request Tester', { exact: true });
  await expect(name).toHaveCSS('color', rgb(light.text));
  await expect(name.locator('..').locator('..')).toHaveCSS(
    'background-color',
    rgb(light.surface),
  );
  await page.screenshot({
    path: '.cache/profile-theme-colors.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveCSS(
    'background-color',
    rgb(light.input),
  );
  await page.getByLabel('Name', { exact: true }).fill('Theme Neighbor');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByText('Theme Neighbor', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('calendar and clock keep working with extracted theme styles', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mockSupabase(page, { signedIn: true });
  await page.goto('/post-suyo');
  await page
    .getByRole('button', { name: 'Open calendar date setter', exact: true })
    .click();
  const calendar = page.getByText('Select Target Date', { exact: true });
  await expect(calendar).toHaveCSS('color', rgb(light.text));
  await expect(calendar.locator('..').locator('..').locator('..')).toHaveCSS(
    'background-color',
    rgb(light.card),
  );
  await page.screenshot({ path: '.cache/calendar-theme-colors.png' });
  await page
    .getByRole('button', { name: 'Close calendar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Open clock time setter', exact: true })
    .click();
  const clock = page.getByText('Clock Time Setter', { exact: true });
  await expect(clock).toHaveCSS('color', rgb(light.text));
  await expect(clock.locator('..').locator('..').locator('..')).toHaveCSS(
    'background-color',
    rgb(light.card),
  );
  await page.screenshot({ path: '.cache/clock-theme-colors.png' });
  await page.getByRole('button', { name: 'Close clock', exact: true }).click();
  expect(errors).toEqual([]);
});
