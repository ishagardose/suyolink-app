const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('profile edits persist and appearance selection survives reload', async ({
  page,
}) => {
  const calls = await mockSupabase(page, { signedIn: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/account');
  await expect(page.getByText('My Profile', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Updated Neighbor');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(
    page.getByText('Your profile has been updated.', { exact: true }),
  ).toBeVisible();
  expect(
    calls.some(
      (c) =>
        c.path === '/rest/v1/profiles' &&
        c.body?.full_name === 'Updated Neighbor',
    ),
  ).toBe(true);
  await page
    .getByRole('radio', { name: 'Dark appearance', exact: true })
    .click();
  await expect(
    page.getByRole('radio', { name: 'Dark appearance', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.reload();
  await expect(
    page.getByRole('radio', { name: 'Dark appearance', exact: true }),
  ).toHaveAttribute('aria-checked', 'true');
  await expect(
    page.getByText('Updated Neighbor', { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({ path: '.cache/profile-dark.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('hamburger menu closes and navigates between dashboard tabs and profile', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page.waitForTimeout(350); // Let the drawer slide settle before visual capture.
  await page.screenshot({ path: '.cache/hamburger-menu.png' });
  await page
    .getByRole('button', { name: 'My accepted tasks', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Close menu', exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText('My accepted tasks', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page.getByRole('button', { name: 'My profile', exact: true }).click();
  await expect(page).toHaveURL(/account$/);
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page
    .getByRole('button', { name: 'My posted suyos', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Close menu', exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByText('My posted suyos', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Close menu backdrop', exact: true })
    .click({ position: { x: 380, y: 400 }, force: true });
  await expect(
    page.getByRole('button', { name: 'Close menu', exact: true }),
  ).not.toBeVisible();
});

test('public profiles show reviews without private account actions', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    workflow: {
      ratings: [
        {
          id: 'rating-1',
          score: 5,
          comment: 'Helpful and on time.',
          created_at: '2026-10-01T12:00:00Z',
        },
      ],
    },
  });
  await page.goto('/profile?userId=another-user');
  await expect(
    page.getByText('Helpful and on time.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Edit Profile', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('requester@example.com', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Sign out', exact: true }),
  ).toHaveCount(0);
});

test('profile and menu fit small phones and desktop', async ({ page }) => {
  await mockSupabase(page, { signedIn: true });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/account');
    await expect(
      page.getByRole('button', { name: 'Edit Profile', exact: true }),
    ).toBeEnabled();
    await page.screenshot({
      path: `.cache/profile-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Go back', exact: true }).click();
    await page
      .getByRole('button', { name: 'Open sidebar', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Change area', exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Close menu', exact: true }).click();
  }
});
