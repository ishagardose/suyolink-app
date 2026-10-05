const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const locationKey = '@suyolink/location/11111111-1111-4111-8111-111111111111';

test('fresh account saves GPS and forwards distance filters for nearby tasks', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.07, longitude: 125.6 });
  const base = {
    requester_id: 'other',
    status: 'open',
    category: 'Groceries',
    offer_centavos: 10000,
    deadline: '2099-12-31T10:30:00Z',
    location: 'Market',
    details: 'Rice',
    notes: '',
    requester: { full_name: 'Ana' },
  };
  const calls = await mockSupabase(page, {
    signedIn: true,
    locationSetup: false,
    requests: [
      {
        ...base,
        id: 'near',
        title: 'Nearby task',
        latitude: 7.075,
        longitude: 125.6,
      },
      {
        ...base,
        id: 'far',
        title: 'Distant task',
        latitude: 7.2,
        longitude: 125.6,
      },
    ],
  });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/set-location$/);
  await expect(
    page.getByRole('button', { name: 'Find nearby suyos' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(page.getByLabel('Selected area coordinates')).toContainText(
    '7.07000, 125.60000',
  );
  await page
    .getByRole('checkbox', { name: 'Location acknowledgment', exact: true })
    .click();
  await page.getByRole('button', { name: 'Find nearby suyos' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Nearby task', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Within 5 km', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect
    .poll(() => calls.some((c) => c.body?.p_radius_km === 5))
    .toBe(true);
  await page.getByRole('button', { name: 'Filters', exact: true }).click();
  await page.getByRole('button', { name: 'Any distance', exact: true }).click();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('Distant task', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(
    JSON.parse(
      await page.evaluate((key) => localStorage.getItem(key), locationKey),
    ).source,
  ).toBe('device');
});

test('manual location works after permission denial and persists through reload and editing', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.addInitScript(() => {
    window.locationRequests = 0;
    navigator.geolocation.getCurrentPosition = (_success, fail) => {
      window.locationRequests++;
      fail({ code: 1, message: 'Permission denied' });
    };
  });
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/set-location$/);
  expect(await page.evaluate(() => window.locationRequests)).toBe(0);
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(page.getByRole('alert')).toContainText(
    /Location permission is off|Permission denied/,
  );
  await page.getByTestId('task-map').click({ position: { x: 150, y: 150 } });
  await page
    .getByRole('checkbox', { name: 'Location acknowledgment', exact: true })
    .click();
  await page.getByRole('button', { name: 'Find nearby suyos' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const saved = await page.evaluate(
    (key) => localStorage.getItem(key),
    locationKey,
  );
  expect(JSON.parse(saved).source).toBe('manual');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Change area', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.locationRequests)).toBe(0);
  await page.getByRole('button', { name: 'Change area', exact: true }).click();
  await expect(page.getByLabel('Selected area coordinates')).toBeVisible();
  await page.getByTestId('task-map').click({ position: { x: 200, y: 160 } });
  await page
    .getByRole('checkbox', { name: 'Location acknowledgment', exact: true })
    .click();
  await page.getByRole('button', { name: 'Find nearby suyos' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), locationKey),
  ).not.toBe(saved);
});

test('another account location cannot satisfy setup and invalid saved data is ignored', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, locationSetup: false });
  await page.addInitScript((key) => {
    localStorage.setItem(
      '@suyolink/location/another-user',
      JSON.stringify({ position: { latitude: 7, longitude: 125 } }),
    );
    localStorage.setItem(
      key,
      JSON.stringify({ position: { latitude: 1000, longitude: 125 } }),
    );
  }, locationKey);
  await page.goto('/post-suyo');
  await expect(page).toHaveURL(/\/set-location$/);
  await expect(
    page.getByRole('button', { name: 'Find nearby suyos' }),
  ).toBeDisabled();
});
