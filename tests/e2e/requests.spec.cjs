const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
async function fillForm(page) {
  await page
    .getByRole('textbox', { name: 'Title', exact: true })
    .fill('Pick up groceries');
  await page
    .getByRole('textbox', { name: 'Task details', exact: true })
    .fill('Buy rice and eggs.');
  await page.getByRole('button', { name: 'Groceries category' }).click();
  await page
    .getByRole('textbox', { name: 'Offer amount (PHP)', exact: true })
    .fill('150.25');
  await page.getByLabel('Deadline', { exact: true }).fill('2099-12-31T18:30');
  await page
    .getByRole('textbox', { name: 'Area or landmark (public)', exact: true })
    .fill('Davao City market');
  await page
    .getByRole('textbox', {
      name: 'Exact address (accepted provider only)',
      exact: true,
    })
    .fill('123 Private Street, Gate 2');
  await page
    .getByRole('textbox', {
      name: 'Task contact phone (accepted provider only)',
      exact: true,
    })
    .fill('+639171234567');
  await page
    .getByRole('textbox', { name: 'Additional notes (optional)', exact: true })
    .fill('Call at the gate.');
}
async function choosePin(page) {
  await page.getByTestId('task-map').click({ position: { x: 150, y: 150 } });
  await expect(page.getByLabel('Selected task coordinates')).toBeVisible();
}

test('post saves a map pin through Supabase and restores it after refresh', async ({
  page,
}) => {
  const calls = await mockSupabase(page, { signedIn: true });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/post-suyo');
  await fillForm(page);
  await expect(page.getByLabel('Selected task coordinates')).toContainText(
    '7.07000, 125.60000',
  );
  await choosePin(page);
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText('Pick up groceries', { exact: true }),
  ).toBeVisible();
  expect(calls.requests).toHaveLength(1);
  expect(calls.requests[0]).toMatchObject({
    offer_centavos: 15025,
    status: 'open',
  });
  expect(Number.isFinite(calls.requests[0].latitude)).toBe(true);
  await page.reload();
  await expect(
    page.getByText('Pick up groceries', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'View location for Pick up groceries' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Focus Pick up groceries' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('failed post retains details and pin and reuses the same retry reference', async ({
  page,
}) => {
  const calls = await mockSupabase(page, { signedIn: true });
  let first;
  await page.route('**/rest/v1/rpc/create_suyo_request_v2', async (route) => {
    if (!first) {
      first = route.request().postDataJSON();
      await route.fulfill({
        status: 503,
        json: { message: 'Service unavailable. Please retry.' },
      });
    } else await route.fallback();
  });
  await page.goto('/post-suyo');
  await fillForm(page);
  await choosePin(page);
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(
    page.getByText('Service unavailable. Please retry.'),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Title', exact: true }),
  ).toHaveValue('Pick up groceries');
  await expect(page.getByLabel('Selected task coordinates')).toBeVisible();
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(calls.requests[0].client_reference).toBe(first.p_client_reference);
  expect(calls.requests).toHaveLength(1);
});

test('nearby map calculates km and filters requests using device location', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.07, longitude: 125.6 });
  const base = {
    requester_id: 'another-user',
    status: 'open',
    deadline: '2099-12-31T10:30:00Z',
    category: 'Groceries',
    offer_centavos: 15000,
    location: 'Market',
    notes: '',
    details: 'Rice',
    requester: { full_name: 'Other User' },
  };
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      {
        ...base,
        id: 'near',
        title: 'Nearby groceries',
        latitude: 7.075,
        longitude: 125.6,
      },
      {
        ...base,
        id: 'far',
        title: 'Far groceries',
        latitude: 7.15,
        longitude: 125.6,
      },
      { ...base, id: 'old', title: 'No pin', latitude: null, longitude: null },
    ],
  });
  await page.goto('/map');
  await expect(
    page.getByRole('button', { name: 'Refresh my location' }),
  ).toBeVisible();
  await expect(page.getByText(/0.6 km away/)).toBeVisible();
  await expect(page.getByText(/8.9 km away/)).toBeVisible();
  await page.getByRole('button', { name: 'Within 1 km', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Focus Nearby groceries' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Focus Far groceries' }),
  ).toHaveCount(0);
  await expect(
    page.getByText('1 older requests have no map pin yet.'),
  ).toBeVisible();
});

test('denied GPS still allows manually placing a pin', async ({ page }) => {
  await mockSupabase(page, { signedIn: true });
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, fail) =>
      fail({ code: 1, message: 'Permission denied' });
  });
  await page.goto('/post-suyo');
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await expect(
    page.getByText(/Location permission is off|Permission denied/),
  ).toBeVisible();
  await choosePin(page);
});
