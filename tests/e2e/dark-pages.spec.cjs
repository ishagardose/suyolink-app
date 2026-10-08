const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const { dark } = require('../../theme/colors.js');
const rgb = (hex) =>
  'rgb(' +
  hex
    .slice(1)
    .match(/../g)
    .map((p) => parseInt(p, 16))
    .join(', ') +
  ')';
async function darkMode(page) {
  await page.addInitScript(() =>
    localStorage.setItem('@suyolink/theme', 'dark'),
  );
}
test('post form, priority explanation, location controls, and deadline dialogs follow dark mode', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await darkMode(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/post-suyo');
  for (const text of [
    'Post a Suyo',
    'Task Overview',
    'Reward Offer (PHP)',
    'Completion Deadline',
    'Task Location Pin',
  ])
    await expect(page.getByText(text, { exact: true })).toHaveCSS(
      'color',
      rgb(dark.text),
    );
  const title = page.getByPlaceholder('e.g. Drop off documents - Unit 402', {
    exact: true,
  });
  await expect(title).toHaveCSS('color', rgb(dark.text));
  await title.fill('Night delivery');
  await expect(
    page
      .getByText('Completion Deadline', { exact: true })
      .locator('..')
      .locator('..'),
  ).toHaveCSS('background-color', rgb(dark.card));
  await page.getByText('Due Tomorrow', { exact: true }).first().click();
  await expect(page.getByText('Normal', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await expect(
    page.getByText('Due Tomorrow', { exact: true }).last(),
  ).toHaveCSS('color', 'rgb(255, 255, 255)');
  const explanation = page.getByText(
    'Scheduled for fulfillment by tomorrow or next day schedule.',
    { exact: true },
  );
  await expect(explanation).toHaveCSS('color', 'rgb(125, 211, 252)');
  await expect(explanation.locator('..')).toHaveCSS(
    'background-color',
    'rgb(18, 50, 71)',
  );
  await page
    .getByRole('button', { name: 'Open calendar date setter', exact: true })
    .click();
  await expect(page.getByText('Select Target Date', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await page
    .getByRole('button', { name: 'Close calendar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Open clock time setter', exact: true })
    .click();
  await expect(page.getByText('Clock Time Setter', { exact: true })).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await page.getByRole('button', { name: 'Close clock', exact: true }).click();
  await expect(
    page.getByText('Clock Time Setter', { exact: true }),
  ).not.toBeVisible();
  await expect(title).toHaveValue('Night delivery');
  await page.screenshot({ path: '.cache/post-suyo-dark.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('location setup cards and acknowledgment use dark surfaces and readable text', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await darkMode(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/set-location');
  await expect(
    page.getByText('Share your location', { exact: true }),
  ).toHaveCSS('color', rgb(dark.text));
  await expect(
    page.getByRole('button', { name: 'Use my current location', exact: true }),
  ).toHaveCSS('background-color', rgb(dark.surface));
  await expect(page.getByText(/I acknowledge that SuyoLink saves/)).toHaveCSS(
    'color',
    rgb(dark.text),
  );
  await page.screenshot({
    path: '.cache/set-location-dark.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
for (const [route, text] of [
  ['/login', 'Email Address'],
  ['/signup', 'Full Name'],
  ['/forgot-password', 'Forgot Password'],
]) {
  test(
    'auth route ' + route + ' keeps dark text fields readable',
    async ({ page }) => {
      await mockSupabase(page);
      await darkMode(page);
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(route);
      if (route === '/forgot-password')
        await expect(page.getByRole('textbox').first()).toHaveCSS(
          'color',
          rgb(dark.text),
        );
      else
        await expect(page.getByLabel(text, { exact: true })).toHaveCSS(
          'color',
          rgb(dark.text),
        );
      expect(errors).toEqual([]);
    },
  );
}
