const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const { light, dark } = require('../../theme/colors.js');
const rgb = (hex) =>
  `rgb(${hex
    .slice(1)
    .match(/../g)
    .map((part) => parseInt(part, 16))
    .join(', ')})`;

test('appearance switches dashboard colors and persists across reload and profile navigation', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/dashboard');
  await expect(page.getByText('Available Suyos', { exact: true })).toHaveCSS(
    'color',
    rgb(light.text),
  );
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page
    .getByRole('radio', { name: 'Dark appearance', exact: true })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Dark appearance', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Available Suyos', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await page.waitForTimeout(350);
  await page.screenshot({ path: '.cache/appearance-sidebar-dark.png' });
  await page.reload();
  await expect(page.getByText('Available Suyos', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await page
    .getByRole('button', { name: 'Open notifications, 0 unread', exact: true })
    .click();
  const inbox = page.getByRole('dialog', {
    name: 'Notifications',
    exact: true,
  });
  await expect(inbox).toHaveCSS('background-color', rgb(dark.card));
  await page.waitForTimeout(350);
  await page.screenshot({ path: '.cache/appearance-notifications-dark.png' });
  await page.goto('/account');
  await expect(page.getByText('Request Tester', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await expect(page.getByRole('radio')).toHaveCount(0);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page
    .getByRole('radio', { name: 'Light appearance', exact: true })
    .click();
  await expect(page.getByText('Available Suyos', { exact: true })).toHaveCSS(
    'color',
    rgb(light.text),
  );
  await page.reload();
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: 'Light appearance', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  expect(errors).toEqual([]);
});

test('system appearance follows device changes while an explicit selection stays fixed', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page
    .getByRole('radio', { name: 'System appearance', exact: true })
    .click();
  const name = page.getByText('Available Suyos', { exact: true });
  await expect(name).toHaveCSS('color', rgb(dark.text));
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(name).toHaveCSS('color', rgb(light.text));
  await page
    .getByRole('radio', { name: 'Dark appearance', exact: true })
    .click();
  await expect(name).toHaveCSS('color', rgb(dark.text));
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(name).toHaveCSS('color', rgb(dark.text));
});

test('wallet and chart render in dark mode without runtime errors', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.addInitScript(() =>
    localStorage.setItem('@suyolink/theme', 'dark'),
  );
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/activity');
  await expect(page.getByText('SUYOLINK WALLET', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.link),
  );
  await expect(
    page.getByText('Monthly Income Trend', { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: '.cache/appearance-wallet-dark.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
