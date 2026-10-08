const { test, expect } = require('@playwright/test');
const { mockSupabase, storageKey } = require('./supabase-fixture.cjs');
const locationKey = '@suyolink/location/11111111-1111-4111-8111-111111111111';

async function accountFields(page) {
  await page.getByLabel('Full Name', { exact: true }).fill('New Neighbor');
  await page
    .getByLabel('Email Address', { exact: true })
    .fill('requester@example.com');
  await page
    .getByLabel('Password', { exact: true })
    .fill('new-account-password');
  await page
    .getByLabel('Confirm Password', { exact: true })
    .fill('new-account-password');
}
async function selectArea(page) {
  await page.getByTestId('task-map').click({ position: { x: 130, y: 120 } });
  await page
    .getByRole('checkbox', { name: 'Location acknowledgment', exact: true })
    .click();
}

for (const confirmation of [false, true]) {
  test(`signup requires acknowledged area before browsing with confirmation=${confirmation}`, async ({
    page,
  }) => {
    const calls = await mockSupabase(page, {
      confirmation,
      locationSetup: false,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/signup');
    await accountFields(page);
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click();
    if (confirmation) {
      await expect(page).toHaveURL(/verify-email/);
      await page.reload();
      await page
        .getByLabel('Verification code', { exact: true })
        .fill('012345');
      await page
        .getByRole('button', { name: 'Verify email', exact: true })
        .click();
      await page
        .getByRole('button', {
          name: 'Continue to set up location',
          exact: true,
        })
        .click();
    }
    await expect(page).toHaveURL(/set-location$/);
    const continueButton = page.getByRole('button', {
      name: 'Find nearby suyos',
      exact: true,
    });
    await expect(continueButton).toBeDisabled();
    await page.getByTestId('task-map').click({ position: { x: 130, y: 120 } });
    await expect(continueButton).toBeDisabled();
    await page
      .getByRole('checkbox', { name: 'Location acknowledgment', exact: true })
      .click();
    await continueButton.click();
    await expect(page).toHaveURL(/dashboard$/);
    await expect(
      page.getByText('Available Suyos', { exact: true }),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate((key) => localStorage.getItem(key), locationKey),
      )
      .not.toBeNull();
    expect(
      calls.find((c) => c.path === '/rest/v1/rpc/save_last_location').body
        .p_source,
    ).toBe('manual');
    await page.reload();
    await expect(page).toHaveURL(/dashboard$/);
    expect(errors).toEqual([]);
  });
}

test('missing location takes priority for signed-in users across protected routes', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  for (const route of [
    '/',
    '/dashboard',
    '/account',
    '/profile',
    '/transactions',
    '/post-suyo',
    '/welcome',
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/set-location$/);
    await expect(
      page.getByRole('button', { name: 'Not now', exact: true }),
    ).toHaveCount(0);
  }
  await selectArea(page);
  await page
    .getByRole('button', { name: 'Find nearby suyos', exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard$/);
});

test('GPS setup resets acknowledgment on pin changes and allows manual selection after denial', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.07, longitude: 125.6 });
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.goto('/set-location');
  await page
    .getByRole('button', { name: 'Use my current location', exact: true })
    .click();
  await expect(page.getByLabel('Selected area coordinates')).toContainText(
    '7.07000, 125.60000',
  );
  await page
    .getByRole('checkbox', { name: 'Location acknowledgment', exact: true })
    .click();
  await page.getByTestId('task-map').click({ position: { x: 100, y: 100 } });
  await expect(
    page.getByRole('checkbox', {
      name: 'Location acknowledgment',
      exact: true,
    }),
  ).not.toBeChecked();
  await page.reload();
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_success, fail) =>
      fail({ code: 1, message: 'Permission denied' });
  });
  await page
    .getByRole('button', { name: 'Use my current location', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText(
    /Location permission is off|Permission denied/,
  );
  await selectArea(page);
  await expect(
    page.getByRole('button', { name: 'Find nearby suyos', exact: true }),
  ).toBeEnabled();
});

test('failed location save cannot unlock the app and can be retried', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.route('**/rest/v1/rpc/save_last_location', (route) =>
    route.fulfill({ status: 500, json: { message: 'Save failed' } }),
  );
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/set-location$/);
  await selectArea(page);
  await page
    .getByRole('button', { name: 'Find nearby suyos', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Save failed');
  expect(
    await page.evaluate((key) => localStorage.getItem(key), locationKey),
  ).toBeNull();
  await page.unroute('**/rest/v1/rpc/save_last_location');
  await page
    .getByRole('button', { name: 'Find nearby suyos', exact: true })
    .click();
  await expect(page).toHaveURL(/dashboard$/);
});

test('other accounts and invalid coordinates cannot satisfy location setup', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({ position: { latitude: 1000, longitude: 125 } }),
    );
    localStorage.setItem(
      '@suyolink/location/another-user',
      JSON.stringify({ position: { latitude: 7, longitude: 125 } }),
    );
    localStorage.setItem(
      '@suyolink/signup-location/other%40example.com',
      JSON.stringify({
        position: { latitude: 7, longitude: 125 },
        source: 'manual',
        acknowledged: true,
      }),
    );
  }, locationKey);
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/set-location$/);
  await expect(
    page.getByRole('button', { name: 'Find nearby suyos', exact: true }),
  ).toBeDisabled();
});

test('users can sign out of required setup without selecting a location', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/set-location$/);
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), storageKey),
  ).toBeNull();
});
