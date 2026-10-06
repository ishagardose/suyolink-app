const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const me = '11111111-1111-4111-8111-111111111111';
const task = {
  id: 'live-task',
  requester_id: me,
  provider_id: 'another-user',
  title: 'Live grocery pickup',
  details: 'Bring the groceries to the gate',
  category: 'Groceries',
  offer_centavos: 12500,
  deadline: '2099-12-31T12:00:00Z',
  location: 'City market',
  latitude: 7.07,
  longitude: 125.6,
  status: 'in_progress',
  notes: '',
  created_at: new Date().toISOString(),
};

async function tracking(page, request) {
  await mockSupabase(page, { signedIn: true, requests: [request] });
  const state = {
    point: null,
    consent: null,
    updates: [],
    choices: [],
    reads: 0,
  };
  await page.route('**/rest/v1/live_locations?**', (route) => {
    state.reads++;
    return route.fulfill({ json: state.point });
  });
  await page.route('**/rest/v1/tracking_consents?**', (route) =>
    route.fulfill({ json: state.consent }),
  );
  await page.route('**/rest/v1/rpc/set_tracking_consent', (route) => {
    const body = route.request().postDataJSON();
    state.choices.push(body.p_share);
    state.consent = {
      request_id: task.id,
      revoked_at: body.p_share ? null : new Date().toISOString(),
    };
    if (!body.p_share) state.point = null;
    return route.fulfill({ json: null });
  });
  await page.route('**/rest/v1/rpc/update_task_location', (route) => {
    const body = route.request().postDataJSON();
    state.updates.push(body);
    state.point = {
      request_id: task.id,
      provider_id: me,
      latitude: body.p_latitude,
      longitude: body.p_longitude,
      accuracy: body.p_accuracy,
      speed: body.p_speed,
      arrived: false,
      updated_at: new Date().toISOString(),
    };
    return route.fulfill({ json: state.point });
  });
  return state;
}

async function gps(page, granted = true) {
  await page.addInitScript((granted) => {
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: { query: async () => ({ state: granted ? 'granted' : 'denied' }) },
    });
    const callbacks = new Map();
    let nextId = 0;
    const point = {
      coords: {
        latitude: 7.065,
        longitude: 125.595,
        accuracy: 5,
        speed: 2,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
      },
      timestamp: Date.now(),
    };
    window.__watchCount = 0;
    window.__clearCount = 0;
    window.__moveDoer = (latitude, longitude) => {
      point.coords.latitude = latitude;
      point.coords.longitude = longitude;
      point.timestamp = Date.now();
      callbacks.forEach((callback) => callback(point));
    };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (success, error) =>
          granted ? success(point) : error({ code: 1, PERMISSION_DENIED: 1 }),
        watchPosition: (success) => {
          const id = ++nextId;
          window.__watchCount++;
          callbacks.set(id, success);
          setTimeout(() => success(point), 0);
          return id;
        },
        clearWatch: (id) => {
          window.__clearCount++;
          callbacks.delete(id);
        },
      },
    });
  }, granted);
}

test('doer starts, sends GPS updates, and stops sharing from the task map', async ({
  page,
}) => {
  const state = await tracking(page, {
    ...task,
    requester_id: 'another-user',
    provider_id: me,
  });
  await gps(page);
  await page.goto('/suyo?id=live-task');
  await page
    .getByRole('button', { name: 'Open live tracking', exact: true })
    .click();
  await expect(page).toHaveURL(/map\?requestId=live-task$/);
  expect(state.choices).toEqual([]);
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  await expect(
    page.getByText('Location sharing is on', { exact: true }),
  ).toBeVisible();
  await expect.poll(() => state.updates.length).toBe(1);
  expect(state.updates[0].p_latitude).toBe(7.065);
  expect(state.updates[0].p_accuracy).toBe(5);
  await page.waitForTimeout(4100); // The upload throttle allows another GPS sample.
  await page.evaluate(() => window.__moveDoer(7.068, 125.598));
  await expect.poll(() => state.updates.length).toBe(2);
  await page.getByRole('button', { name: 'Stop sharing', exact: true }).click();
  await expect(
    page.getByText('Location sharing has stopped', { exact: true }),
  ).toBeVisible();
  expect(state.choices).toEqual([true, false]);
  await expect(
    page.getByTestId('task-map').locator('.suyo-map-connection'),
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.__clearCount)).toBe(1);
  await page.evaluate(() => window.__moveDoer(7.07, 125.6));
  expect(state.updates.length).toBe(2);
});

test('leaving the map revokes sharing and removes the GPS watcher', async ({
  page,
}) => {
  const state = await tracking(page, {
    ...task,
    requester_id: 'another-user',
    provider_id: me,
  });
  await gps(page);
  await page.goto('/suyo?id=live-task');
  await page
    .getByRole('button', { name: 'Open live tracking', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  await expect(
    page.getByText('Location sharing is on', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(page).toHaveURL(/suyo\?id=live-task$/);
  await expect.poll(() => state.choices).toEqual([true, false]);
  expect(await page.evaluate(() => window.__clearCount)).toBe(1);
});

test('requester can track movement and stale positions disappear from the live map', async ({
  page,
}) => {
  const state = await tracking(page, task);
  state.consent = { request_id: task.id, revoked_at: null };
  state.point = {
    request_id: task.id,
    latitude: 7.065,
    longitude: 125.595,
    accuracy: 5,
    speed: 2,
    arrived: false,
    updated_at: new Date().toISOString(),
  };
  await page.goto('/suyo?id=live-task');
  await page
    .getByRole('button', { name: 'Track my doer', exact: true })
    .click();
  await expect(
    page.getByText('Receiving live location', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByTestId('task-map').locator('.suyo-map-marker-destination'),
  ).toHaveCount(1);
  await expect(
    page.getByTestId('task-map').locator('.suyo-map-marker-doer'),
  ).toHaveCount(1);
  const connection = page
    .getByTestId('task-map')
    .locator('.suyo-map-connection');
  await expect(connection).toHaveCount(1);
  await expect(connection).toHaveAttribute('d', /M.+L/);
  await page.screenshot({
    path: '.cache/live-tracking-markers.png',
    fullPage: true,
  });
  await expect(
    page.getByRole('button', { name: 'Share location', exact: true }),
  ).toHaveCount(0);
  const initialLine = await connection.getAttribute('d');
  state.point.latitude = 7.068;
  state.point.longitude = 125.598;
  state.point.updated_at = new Date().toISOString();
  await page.getByRole('button', { name: 'Refresh map', exact: true }).click();
  await expect(connection).not.toHaveAttribute('d', initialLine);
  state.point.updated_at = new Date(Date.now() - 60000).toISOString();
  await page.getByRole('button', { name: 'Refresh map', exact: true }).click();
  await expect(
    page.getByText('Location update is stale. Waiting for a fresh position.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByTestId('task-map').locator('.suyo-map-marker-destination'),
  ).toHaveCount(1);
  await expect(
    page.getByTestId('task-map').locator('.suyo-map-marker-doer'),
  ).toHaveCount(0);
  await expect(connection).toHaveCount(0);
  state.point.updated_at = new Date().toISOString();
  state.point.latitude = 7.07001;
  state.point.longitude = 125.60001;
  state.point.arrived = true;
  await page.getByRole('button', { name: 'Refresh map', exact: true }).click();
  await expect(
    page.getByText('Doer is near the destination', { exact: true }),
  ).toBeVisible();
  await expect(connection).toHaveCount(1);
  await page.screenshot({
    path: '.cache/live-tracking-requester.png',
    fullPage: true,
  });
});

test('denied GPS permission never enables sharing', async ({ page }) => {
  const state = await tracking(page, {
    ...task,
    requester_id: 'another-user',
    provider_id: me,
  });
  await gps(page, false);
  await page.goto('/map?requestId=live-task');
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  await expect(
    page.getByText(
      'Allow location access in settings to share your position.',
      { exact: true },
    ),
  ).toBeVisible();
  expect(state.choices).toEqual([]);
  expect(state.updates).toEqual([]);
});

test('unrelated users only get the public task map without live-location queries', async ({
  page,
}) => {
  const state = await tracking(page, {
    ...task,
    requester_id: 'someone-else',
    provider_id: 'another-user',
  });
  await page.goto('/suyo?id=live-task');
  await expect(page.getByText('Live tracking', { exact: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'View task location', exact: true })
    .click();
  await expect(page.getByTestId('task-map')).toBeVisible();
  expect(state.reads).toBe(0);
  await expect(
    page.getByRole('button', { name: 'Share location', exact: true }),
  ).toHaveCount(0);
});

test('opening proof submission stops sharing even when the map remains in the navigation stack', async ({
  page,
}) => {
  const state = await tracking(page, {
    ...task,
    requester_id: 'another-user',
    provider_id: me,
  });
  await gps(page);
  await page.goto('/map?requestId=live-task');
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  await expect(
    page.getByText('Location sharing is on', { exact: true }),
  ).toBeVisible();
  await expect.poll(() => state.point).not.toBeNull();
  state.point.arrived = true;
  await page.getByRole('button', { name: 'Refresh map', exact: true }).click();
  await page.getByRole('button', { name: "I've arrived", exact: true }).click();
  await expect(page).toHaveURL(/proof\?id=live-task$/);
  await expect.poll(() => state.choices).toEqual([true, false]);
  expect(await page.evaluate(() => window.__clearCount)).toBe(1);
});

test('hiding the browser stops sharing and removes the GPS watcher', async ({
  page,
}) => {
  const state = await tracking(page, {
    ...task,
    requester_id: 'another-user',
    provider_id: me,
  });
  await gps(page);
  await page.goto('/map?requestId=live-task');
  await page
    .getByRole('button', { name: 'Share location', exact: true })
    .click();
  await expect(
    page.getByText('Location sharing is on', { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => state.choices).toEqual([true, false]);
  expect(await page.evaluate(() => window.__clearCount)).toBe(1);
});
