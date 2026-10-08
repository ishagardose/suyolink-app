const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const task = (extra = {}) => ({
  id: 'task-real',
  requester_id: other,
  provider_id: me,
  title: 'Bring market groceries',
  details: 'Meet at the gate',
  category: 'Groceries',
  offer_centavos: 12345,
  deadline: '2099-12-31T10:30:00Z',
  location: 'City market',
  status: 'assigned',
  latitude: 7.07,
  longitude: 125.6,
  requester: { full_name: 'Real requester' },
  ...extra,
});
async function tracking(page) {
  await page.route('**/rest/v1/live_locations?**', (route) =>
    route.fulfill({ json: null }),
  );
  await page.route('**/rest/v1/tracking_consents?**', (route) =>
    route.fulfill({ json: null }),
  );
}
test('wallet uses confirmed backend rewards in both entry points and shows spending with a minus sign', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    workflow: {
      transactions: [
        {
          request_id: 'earned',
          title: 'Confirmed reward',
          role: 'provider',
          reward_centavos: 12345,
          completed_at: new Date().toISOString(),
        },
        {
          request_id: 'spent',
          title: 'Requested groceries',
          role: 'requester',
          reward_centavos: 4000,
          completed_at: new Date().toISOString(),
        },
      ],
    },
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/wallet');
  await expect(page.getByText('+₱123.45', { exact: true })).toBeVisible();
  await expect(page.getByText('Verified User', { exact: true })).toHaveCount(0);
  await page.getByText('Spent (1)', { exact: true }).click();
  await expect(page.getByText('−₱40.00', { exact: true })).toBeVisible();
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page.getByText('Wallet', { exact: true }).click();
  await expect(page.getByText('+₱123.45', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('wallet exposes backend failure and retries without inventing transactions', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  let fail = true;
  await page.route('**/rest/v1/rpc/get_my_transactions', (route) =>
    fail
      ? route.fulfill({ status: 503, json: { message: 'Wallet offline' } })
      : route.fulfill({ json: [] }),
  );
  await page.goto('/wallet');
  await expect(page.getByRole('alert')).toContainText('Wallet offline');
  await expect(
    page.getByText('No suyo earnings yet', { exact: true }),
  ).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Retry wallet' }).click();
  await expect(
    page.getByText('No suyo earnings yet', { exact: true }),
  ).toBeVisible();
});
test('fulfillment has a real deadline in dark mode and starts via backend before proof submission', async ({
  page,
}) => {
  const calls = await mockSupabase(page, {
    signedIn: true,
    requests: [task()],
  });
  await tracking(page);
  await page.addInitScript(() =>
    localStorage.setItem('@suyolink/theme', 'dark'),
  );
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/fulfill?id=task-real');
  await expect(
    page.getByText('Bring market groceries', { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText('Completion deadline', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Thu, Dec 31, 2099/)).toHaveCSS(
    'color',
    'rgb(243, 244, 246)',
  );
  await expect(
    page.getByText('2099-12-31T10:30:00Z', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Start task', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Upload completion proof' }),
  ).toBeVisible();
  expect(
    calls
      .filter((c) => c.path.endsWith('/change_suyo_status'))
      .map((c) => c.body),
  ).toEqual([{ p_request_id: 'task-real', p_status: 'in_progress' }]);
  await page.getByRole('button', { name: 'Upload completion proof' }).click();
  await expect(page).toHaveURL(/\/proof\?id=task-real/);
  expect(errors).toEqual([]);
});
test('fulfillment blocks unrelated accounts and requester reviews the real uploaded proof', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [task({ requester_id: other, provider_id: other })],
  });
  await tracking(page);
  await page.goto('/fulfill?id=task-real');
  await expect(
    page.getByText(
      'Only the requester and assigned doer can access fulfillment.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Start task', exact: true }),
  ).toHaveCount(0);
});
test('requester proof button opens backend review instead of completing locally', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      task({
        requester_id: me,
        provider_id: other,
        status: 'awaiting_confirmation',
      }),
    ],
    workflow: {
      proofs: [
        {
          id: 'proof-real',
          request_id: 'task-real',
          created_at: new Date().toISOString(),
        },
      ],
    },
  });
  await tracking(page);
  await page.goto('/requester-fulfill?id=task-real');
  await expect(
    page.getByText(/earnings are pending requester confirmation/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Review completion proof' }).click();
  await expect(page).toHaveURL(/review-proof/);
  await expect(page).toHaveURL(/id=proof-real/);
});
test('map entry route renders a real map with backend task pins', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [task({ provider_id: null, status: 'open' })],
  });
  await page.goto('/map');
  await expect(page.getByTestId('task-map')).toBeVisible();
  await expect(page.locator('.leaflet-interactive')).toHaveCount(1);
  await page.locator('.leaflet-interactive').click();
  await expect(page).toHaveURL(/requestId=task-real/);
  await expect(
    page.getByText('Bring market groceries', { exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText(/5 min.*away/i)).toHaveCount(0);
});

test('dashboard fulfillment saves acceptance before navigating and stays on the task after a failed acceptance', async ({
  page,
}) => {
  const request = task({ provider_id: null, status: 'open' });
  await mockSupabase(page, { signedIn: true, requests: [request] });
  await tracking(page);
  let fail = true,
    accepted = 0;
  await page.route('**/rest/v1/rpc/accept_suyo', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      p_request_id: request.id,
    });
    if (fail)
      return route.fulfill({
        status: 409,
        json: { message: 'Acceptance could not be saved' },
      });
    accepted++;
    request.provider_id = me;
    request.status = 'assigned';
    return route.fulfill({ json: request });
  });
  await page.goto('/dashboard');
  await page.getByText(request.title, { exact: true }).first().click();
  await page.getByRole('button', { name: 'Fulfill Suyo', exact: true }).click();
  await expect(
    page.getByText('Acceptance could not be saved', { exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/dashboard$/);
  await expect(
    page.getByRole('button', { name: 'Fulfill Suyo', exact: true }),
  ).toBeVisible();
  expect(request.provider_id).toBeNull();
  fail = false;
  await page.getByRole('button', { name: 'Fulfill Suyo', exact: true }).click();
  await expect(page).toHaveURL(/fulfill\?id=task-real/);
  await expect(
    page.getByRole('button', { name: 'Start task', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Only the requester and assigned doer can access fulfillment.',
    ),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Start task', exact: true }),
  ).toBeVisible();
  expect(accepted).toBe(1);
});
