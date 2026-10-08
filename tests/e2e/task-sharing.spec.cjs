const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const task = {
  id: 'tracking-task',
  requester_id: '22222222-2222-4222-8222-222222222222',
  provider_id: '11111111-1111-4111-8111-111111111111',
  title: 'Deliver groceries',
  details: 'Meet at the gate',
  category: 'Groceries',
  offer_centavos: 10000,
  deadline: '2099-12-31T10:30:00Z',
  location: 'Market',
  status: 'assigned',
  latitude: 7.07,
  longitude: 125.6,
  requester: { full_name: 'Requester' },
};
async function backend(page, fail = false) {
  await mockSupabase(page, { signedIn: true, requests: [task] });
  await page.route('https://router.project-osrm.org/**', (r) =>
    r.fulfill({
      json: {
        code: 'Ok',
        routes: [
          {
            distance: 1400,
            duration: 360,
            geometry: {
              coordinates: [
                [125.605, 7.075],
                [125.6, 7.075],
                [125.6, 7.07],
              ],
            },
          },
        ],
      },
    }),
  );
  let consent = null,
    position = null;
  await page.route('**/rest/v1/tracking_consents?**', (r) =>
    r.fulfill({ json: consent }),
  );
  await page.route('**/rest/v1/live_locations?**', (r) =>
    r.fulfill({ json: position }),
  );
  await page.route('**/rest/v1/rpc/set_tracking_consent', async (r) => {
    if (fail)
      return r.fulfill({
        status: 400,
        json: { message: 'Tracking service unavailable. Try again.' },
      });
    const share = r.request().postDataJSON().p_share;
    consent = {
      request_id: task.id,
      revoked_at: share ? null : new Date().toISOString(),
    };
    if (!share) position = null;
    return r.fulfill({ json: null });
  });
  await page.route('**/rest/v1/rpc/update_task_location', (r) => {
    const body = r.request().postDataJSON();
    position = {
      latitude: body.p_latitude,
      longitude: body.p_longitude,
      updated_at: new Date().toISOString(),
    };
    return r.fulfill({ json: position });
  });
}
for (const route of ['/fulfill?id=', '/map?id=']) {
  test(
    'sharing publishes a real GPS point and draws a line on ' + route,
    async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 7.075, longitude: 125.605 });
      await backend(page);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(route + task.id);
      await page
        .getByRole('button', { name: 'Share location', exact: true })
        .click();
      await expect(
        page.getByRole('button', { name: 'Stop sharing', exact: true }),
      ).toBeVisible();
      await expect(page.locator('.task-road-route')).toHaveCount(1);
      await expect(page.getByText(/Driving route: 1.40 km/)).toBeVisible();
      await expect(page.getByText(/Estimated 6 min/)).toBeVisible();
      await page
        .getByRole('button', { name: 'Stop sharing', exact: true })
        .click();
      await expect(
        page.getByRole('button', { name: 'Share location', exact: true }),
      ).toBeVisible();
      await expect(page.locator('.task-road-route')).toHaveCount(0);
      expect(errors).toEqual([]);
    },
  );
}
test('a sharing failure stays visible after the automatic task refresh', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.075, longitude: 125.605 });
  await backend(page, true);
  await page.goto('/fulfill?id=' + task.id);
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  const error = page.getByText('Tracking service unavailable. Try again.', {
    exact: true,
  });
  await expect(error).toBeVisible();
  await page.waitForResponse((r) => r.url().includes('/rpc/get_suyo_details'));
  await expect(error).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Share location', exact: true }),
  ).toBeEnabled();
});

test('failed road routing keeps pins, shows no fake line, and can retry', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.075, longitude: 125.605 });
  await backend(page);
  let attempts = 0;
  await page.route('https://router.project-osrm.org/**', async (r) => {
    attempts++;
    if (attempts === 1)
      return r.fulfill({ status: 503, json: { code: 'Unavailable' } });
    return r.fulfill({
      json: {
        code: 'Ok',
        routes: [
          {
            distance: 1400,
            duration: 360,
            geometry: {
              coordinates: [
                [125.605, 7.075],
                [125.6, 7.075],
                [125.6, 7.07],
              ],
            },
          },
        ],
      },
    });
  });
  await page.goto('/fulfill?id=' + task.id);
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  await expect(
    page.getByText('Road route could not load. Try again.', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.task-road-route')).toHaveCount(0);
  await expect(page.locator('.leaflet-interactive')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Retry road route', exact: true })
    .click();
  await expect(page.locator('.task-road-route')).toHaveCount(1);
  await expect(page.getByText(/Driving route: 1.40 km/)).toBeVisible();
  expect(attempts).toBe(2);
});
