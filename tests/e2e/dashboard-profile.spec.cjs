const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
async function openEditor(page) {
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await expect(
    page.getByText('Edit Account Profile', { exact: true }),
  ).toBeVisible();
}
test('dashboard profile edits persist through reload', async ({ page }) => {
  const calls = await mockSupabase(page, { signedIn: true });
  await page.goto('/dashboard');
  await openEditor(page);
  await expect(
    page.getByLabel('Email Address', { exact: true }),
  ).not.toBeEditable();
  await page.getByLabel('Full Name', { exact: true }).fill('Updated neighbor');
  await page.getByLabel('Phone Number', { exact: true }).fill('+639123456789');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(
    page.getByText('Edit Account Profile', { exact: true }),
  ).toBeHidden();
  expect(
    calls.some(
      (c) =>
        c.path === '/rest/v1/profiles' &&
        c.body?.full_name === 'Updated neighbor',
    ),
  ).toBe(true);
  expect(
    calls.some(
      (c) =>
        c.path === '/rest/v1/profile_contacts' &&
        c.body?.phone === '+639123456789',
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByText('Updated neighbor', { exact: true }).first(),
  ).toBeVisible();
  await openEditor(page);
  await expect(page.getByLabel('Phone Number', { exact: true })).toHaveValue(
    '+639123456789',
  );
});
test('failed dashboard contact save keeps the draft and allows retry', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  let fail = true;
  await page.route('**/rest/v1/profile_contacts?**', (route) => {
    if (fail && route.request().method() === 'PATCH')
      return route.fulfill({
        status: 503,
        json: { message: 'Temporary failure' },
      });
    return route.fallback();
  });
  await page.goto('/dashboard');
  await openEditor(page);
  await page.getByLabel('Full Name', { exact: true }).fill('Retry neighbor');
  await page.getByLabel('Phone Number', { exact: true }).fill('+639123456789');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'contact details could not be saved',
  );
  await expect(page.getByLabel('Phone Number', { exact: true })).toHaveValue(
    '+639123456789',
  );
  fail = false;
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(
    page.getByText('Edit Account Profile', { exact: true }),
  ).toBeHidden();
});

test('available tasks appear after loading without changing search', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      {
        id: 'fresh-task',
        requester_id: 'another-user',
        provider_id: null,
        title: 'Loaded from the backend',
        details: 'Keep the receipt',
        category: 'Groceries',
        offer_centavos: 12500,
        deadline: '2099-12-31T12:00:00Z',
        location: 'City market',
        latitude: 7.07,
        longitude: 125.6,
        status: 'open',
        created_at: new Date().toISOString(),
      },
    ],
  });
  await page.goto('/dashboard');
  await expect(page.getByLabel('Search suyos', { exact: true })).toHaveValue(
    '',
  );
  await expect(
    page.getByText('Loaded from the backend', { exact: true }),
  ).toBeVisible();
  await page.getByText('Loaded from the backend', { exact: true }).click();
  await page.getByText('Fulfill Suyo', { exact: true }).click();
  await expect(page).toHaveURL(/suyo\?id=fresh-task$/);
  await expect(
    page.getByRole('button', { name: 'Apply to this Suyo', exact: true }),
  ).toBeVisible();
});

test('signed out deep links cannot bypass the protected route groups', async ({
  page,
}) => {
  await mockSupabase(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      '@suyolink/mock-user',
      JSON.stringify({ name: 'Old Mock' }),
    ),
  );
  for (const route of [
    '/dashboard',
    '/map',
    '/post-suyo',
    '/wallet',
    '/activity',
    '/account',
    '/fulfill',
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel('Title', { exact: true })).toHaveCount(0);
  }
});
