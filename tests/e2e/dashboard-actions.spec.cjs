const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const me = '11111111-1111-4111-8111-111111111111';
const task = (overrides = {}) => ({
  id: 'dashboard-task',
  requester_id: me,
  requester: { full_name: 'Request Tester' },
  provider_id: null,
  title: 'Errand to update',
  details: 'Buy rice at the market',
  category: 'Groceries',
  notes: 'Keep the receipt',
  offer_centavos: 15000,
  reward_boost_centavos: 0,
  deadline: '2099-12-31T12:00:00Z',
  location: 'Public market area',
  latitude: 7.07,
  longitude: 125.6,
  status: 'open',
  exact_address: 'Private gate 12',
  contact_phone: '+639123456789',
  created_at: new Date().toISOString(),
  ...overrides,
});
async function openPosted(page, title = 'Errand to update') {
  await page.goto('/dashboard');
  await page.getByText('MySuyo', { exact: true }).click();
  await page.getByText(title, { exact: true }).click();
}

test('edit saves to the backend, survives reload, and retains draft after failure', async ({
  page,
}) => {
  const requests = [task()];
  const calls = await mockSupabase(page, { signedIn: true, requests });
  let fail = true;
  await page.route('**/rest/v1/rpc/edit_suyo_request', (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { message: 'Edit temporarily unavailable' },
        })
      : route.fallback(),
  );
  await openPosted(page);
  await page.getByText('Edit', { exact: true }).click();
  await expect(page.getByLabel('Edit task notes')).toHaveValue(
    'Keep the receipt',
  );
  await page.getByLabel('Edit task title').fill('Saved errand');
  await page.getByLabel('Edit reward offer').fill('180.50');
  await page.getByLabel('Edit task notes').fill('Updated instructions');
  await page.getByRole('button', { name: 'Save task changes' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Edit temporarily unavailable',
  );
  expect(requests[0].title).toBe('Errand to update');
  await expect(page.getByLabel('Edit task title')).toHaveValue('Saved errand');
  fail = false;
  await page.getByRole('button', { name: 'Save task changes' }).click();
  await expect(
    page.getByText('Edit Suyo Details', { exact: true }),
  ).toBeHidden();
  expect(
    calls.findLast((c) => c.path.endsWith('/edit_suyo_request')).body,
  ).toMatchObject({ p_offer_centavos: 18050, p_notes: 'Updated instructions' });
  await openPosted(page, 'Saved errand');
  await page.getByText('Edit', { exact: true }).click();
  await expect(page.getByLabel('Edit reward offer')).toHaveValue('180.5');
  await expect(page.getByLabel('Edit task notes')).toHaveValue(
    'Updated instructions',
  );
});

test('boost selection persists, replaces the prior boost, and resets to base', async ({
  page,
}) => {
  const requests = [task()];
  await mockSupabase(page, { signedIn: true, requests });
  await openPosted(page);
  await page
    .getByRole('button', { name: 'Boost reward by 20 pesos', exact: true })
    .click();
  await expect.poll(() => requests[0].offer_centavos).toBe(17000);
  await openPosted(page);
  await expect(
    page.getByRole('button', { name: 'Boost reward by 20 pesos' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Boost reward by 50 pesos' }).click();
  await expect.poll(() => requests[0].offer_centavos).toBe(20000);
  await expect(
    page.getByText('Saving changes...', { exact: true }),
  ).toBeHidden();
  await page.getByRole('button', { name: 'Reset reward boost' }).click();
  await expect.poll(() => requests[0].offer_centavos).toBe(15000);
  await openPosted(page);
  await expect(
    page.getByRole('button', { name: 'Reset reward boost' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('cancel reports failures and only removes the open task after a successful RPC', async ({
  page,
}) => {
  const requests = [task()];
  await mockSupabase(page, { signedIn: true, requests });
  let fail = true;
  await page.route('**/rest/v1/rpc/change_suyo_status', (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { message: 'Cancellation temporarily unavailable' },
        })
      : route.fallback(),
  );
  await openPosted(page);
  await page.getByText('Cancel', { exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Cancellation temporarily unavailable',
  );
  expect(requests[0].status).toBe('open');
  fail = false;
  await page.getByText('Cancel', { exact: true }).click();
  await expect.poll(() => requests[0].status).toBe('cancelled');
  await page.reload();
  await page.getByText('MySuyo', { exact: true }).click();
  await expect(
    page.getByText('Errand to update', { exact: true }),
  ).toBeHidden();
  await page.getByText('Cancelled', { exact: true }).click();
  await expect(
    page.getByText('Errand to update', { exact: true }),
  ).toBeVisible();
});

test('repost reviews the original private details and creates a distinct backend task with a fresh deadline', async ({
  page,
}) => {
  const requests = [
    task({ status: 'cancelled', deadline: '2020-01-01T12:00:00Z' }),
  ];
  const calls = await mockSupabase(page, { signedIn: true, requests });
  await page.goto('/dashboard');
  await page.getByText('MySuyo', { exact: true }).click();
  await page.getByText('Cancelled', { exact: true }).click();
  await page.getByText('Errand to update', { exact: true }).click();
  await page.getByText('Re-post Suyo', { exact: true }).click();
  await expect(page).toHaveURL(/post-suyo\?repost=dashboard-task$/);
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Errand to update',
  );
  await expect(page.getByLabel('Contact phone', { exact: true })).toHaveValue(
    '9123456789',
  );
  await expect(page.getByLabel('Target date', { exact: true })).toHaveValue('');
  expect(
    calls.filter((c) => c.path.endsWith('/create_suyo_request_v2')),
  ).toHaveLength(0);
  await page.getByLabel('Target date', { exact: true }).fill('2099-12-30');
  await page.getByLabel('Target time', { exact: true }).fill('12:30');
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect.poll(() => requests.length).toBe(2);
  const created = requests.find((r) => r.id !== 'dashboard-task');
  expect(created).toMatchObject({
    status: 'open',
    provider_id: null,
    exact_address: 'Private gate 12',
    contact_phone: '+639123456789',
    location: 'Public market area',
  });
  expect(requests.find((r) => r.id === 'dashboard-task').status).toBe(
    'cancelled',
  );
  await openPosted(page);
  await expect(page.getByText('Edit', { exact: true })).toBeVisible();
});

test('repost refuses another user task', async ({ page }) => {
  const calls = await mockSupabase(page, {
    signedIn: true,
    requests: [task({ requester_id: 'someone-else' })],
  });
  await page.goto('/post-suyo?repost=dashboard-task');
  await expect(page.getByRole('alert')).toContainText(
    'Only your own requests can be reposted.',
  );
  await expect(
    page.getByRole('button', { name: 'Post request', exact: true }),
  ).toBeDisabled();
  expect(calls.some((c) => c.path.endsWith('/create_suyo_request_v2'))).toBe(
    false,
  );
});

test('repost loading failure blocks posting and can be retried', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true, requests: [task()] });
  let fail = true;
  await page.route('**/rest/v1/rpc/get_suyo_details', (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { message: 'Original task temporarily unavailable' },
        })
      : route.fallback(),
  );
  await page.goto('/post-suyo?repost=dashboard-task');
  await expect(page.getByRole('alert')).toContainText(
    'Original task temporarily unavailable',
  );
  await expect(
    page.getByRole('button', { name: 'Post request', exact: true }),
  ).toBeDisabled();
  fail = false;
  await page
    .getByRole('button', { name: 'Retry loading original task' })
    .click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue(
    'Errand to update',
  );
  await expect(
    page.getByRole('button', { name: 'Post request', exact: true }),
  ).toBeEnabled();
});

test('doer cancellation persists and retains the confirmation on failure', async ({
  page,
}) => {
  const requests = [
    task({
      requester_id: 'other-requester',
      provider_id: me,
      status: 'assigned',
    }),
  ];
  await mockSupabase(page, { signedIn: true, requests });
  let fail = true;
  await page.route('**/rest/v1/rpc/change_suyo_status', (route) =>
    fail
      ? route.fulfill({
          status: 503,
          json: { message: 'Please retry cancellation' },
        })
      : route.fallback(),
  );
  await page.goto('/dashboard');
  await page.getByText('Doer Suyo', { exact: true }).click();
  await page.getByText('Cancel as Doer', { exact: true }).click();
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Please retry cancellation',
  );
  expect(requests[0].status).toBe('assigned');
  fail = false;
  await page.getByRole('button', { name: 'Confirm cancellation' }).click();
  await expect.poll(() => requests[0].status).toBe('cancelled');
  await expect(
    page.getByText('Cancel Accepted Suyo?', { exact: true }),
  ).toBeHidden();
  await page.reload();
  await page.getByText('Doer Suyo', { exact: true }).click();
  await expect(page.getByText('Cancel as Doer', { exact: true })).toBeHidden();
});
