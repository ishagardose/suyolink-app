const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const task = (overrides = {}) => ({ id: 'task-1', requester_id: other, provider_id: null, title: 'Market delivery', details: 'Bring rice to the gate',
  category: 'Delivery', offer_centavos: 15000, deadline: '2099-12-31T10:30:00Z', location: 'City market', notes: '',
  status: 'open', latitude: 7.07, longitude: 125.6, requester: { full_name: 'Requester' }, ...overrides });

test('apply, find application in My Suyos, withdraw, and handle failed actions', async ({ page }) => {
  const request = task();
  const workflow = { applications: [] };
  await mockSupabase(page, { signedIn: true, requests: [request], workflow });
  let fail = true;
  await page.route('**/rest/v1/rpc/apply_to_suyo', async route => {
    expect(route.request().postDataJSON()).toEqual({ p_request_id: request.id });
    if (fail) { fail = false; return route.fulfill({ status: 503, json: { message: 'Please retry application' } }); }
    workflow.applications.push({ id: 'application-1', request_id: request.id, applicant_id: me, status: 'pending' });
    await route.fulfill({ json: workflow.applications[0] });
  });
  await page.route('**/rest/v1/rpc/withdraw_application', async route => {
    workflow.applications[0].status = 'withdrawn';
    await route.fulfill({ json: null });
  });
  await page.goto('/suyo?id=task-1');
  await page.getByRole('button', { name: 'Apply to this Suyo' }).click();
  await expect(page.getByText('Please retry application')).toBeVisible();
  await page.getByRole('button', { name: 'Apply to this Suyo' }).click();
  await expect(page.getByText('Your application: pending')).toBeVisible();
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'My Suyos', exact: true }).click();
  await page.getByRole('button', { name: 'Applications', exact: true }).click();
  await expect(page.getByText('Application: pending')).toBeVisible();
  await page.getByRole('button', { name: 'Open task Market delivery' }).click();
  await page.getByRole('button', { name: 'Withdraw application' }).click();
  await expect(page.getByText('Your application: withdrawn')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply to this Suyo' })).toHaveCount(0);
});

test('requester chooses a provider, approves proof, rates and sees history', async ({ page }) => {
  const request = task({ requester_id: me });
  const workflow = { applications: [{ id: 'a', request_id: request.id, applicant_id: other, status: 'pending', applicant: { full_name: 'Ana' } }], proofs: [], ratings: [], request_events: [] };
  await mockSupabase(page, { signedIn: true, requests: [request], workflow });
  await page.route('**/rest/v1/rpc/decide_application', async route => {
    expect(route.request().postDataJSON()).toEqual({ p_application_id: 'a', p_accept: true });
    request.provider_id = other; request.status = 'assigned'; workflow.applications[0].status = 'accepted';
    await route.fulfill({ json: workflow.applications[0] });
  });
  await page.route('**/rest/v1/rpc/review_suyo_proof', async route => {
    const body = route.request().postDataJSON();
    request.status = body.p_accept ? 'completed' : 'in_progress';
    workflow.proofs[0].status = body.p_accept ? 'accepted' : 'rejected';
    workflow.proofs[0].rejection_reason = body.p_reason;
    workflow.request_events.push({ id: 'event-1', request_id: request.id, to_status: request.status, created_at: new Date().toISOString() });
    await route.fulfill({ json: request });
  });
  await page.route('**/rest/v1/rpc/rate_suyo_provider', async route => {
    const body = route.request().postDataJSON();
    workflow.ratings.push({ id: 'rating-1', request_id: request.id, provider_id: other, score: body.p_score, comment: body.p_comment });
    await route.fulfill({ json: workflow.ratings[0] });
  });
  await page.route('**/storage/v1/object/sign/**', route => route.fulfill({ json: { signedURL: '/object/sign/suyo-proofs/test.png?token=test' } }));
  await page.route('**/storage/v1/object/sign/**?token=test', route => route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') }));
  await page.goto('/suyo?id=task-1');
  await expect(page.getByRole('button', { name: 'Apply to this Suyo' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Accept Ana' }).click();
  await expect(page.getByText('Ana · accepted')).toBeVisible();
  request.status = 'awaiting_confirmation';
  workflow.proofs.push({ id: 'proof-1', request_id: request.id, storage_path: 'task-1/provider/proof.png', status: 'submitted', note: 'Delivered' });
  await page.getByRole('button', { name: 'Refresh task' }).click();
  await expect(page.getByRole('button', { name: 'Request changes', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Approve completion' }).click();
  await page.getByRole('button', { name: '5 stars' }).click();
  await page.getByRole('textbox', { name: 'Review (optional)' }).fill('Great work');
  await page.getByRole('button', { name: 'Submit rating' }).click();
  await expect(page.getByText('Rating: 5 / 5', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Submit rating' })).toHaveCount(0);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Activity', exact: true }).click();
  await expect(page.getByText('Market delivery', { exact: true })).toBeVisible();
});

test('provider starts task and uploads proof to private storage', async ({ page }) => {
  const request = task({ status: 'assigned', provider_id: me });
  const workflow = { proofs: [] };
  await mockSupabase(page, { signedIn: true, requests: [request], workflow });
  await page.route('**/rest/v1/rpc/change_suyo_status', async route => {
    expect(route.request().postDataJSON().p_status).toBe('in_progress');
    request.status = 'in_progress'; await route.fulfill({ json: request });
  });
  let uploaded = false;
  await page.route('**/storage/v1/object/suyo-proofs/**', async route => {
    expect(route.request().method()).toBe('POST'); uploaded = true;
    await route.fulfill({ json: { Key: 'proof.png' } });
  });
  await page.route('**/rest/v1/rpc/submit_suyo_proof', async route => {
    expect(uploaded).toBe(true);
    const body = route.request().postDataJSON();
    expect(body.p_storage_path).toContain(`${request.id}/${me}/`);
    request.status = 'awaiting_confirmation';
    await route.fulfill({ json: {} });
  });
  await page.goto('/suyo?id=task-1');
  await page.getByRole('button', { name: 'Start task' }).click();
  await expect(page.getByRole('button', { name: 'Submit proof' })).toBeDisabled();
  const chooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose proof photo' }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: 'proof.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
  await expect(page.getByLabel('Selected proof photo')).toBeVisible();
  await page.getByRole('button', { name: 'Submit proof' }).click();
  await expect(page.getByText(/Awaiting confirmation ·/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approve completion' })).toHaveCount(0);
});

test('notifications mark read and navigate; search and filters exclude expired tasks', async ({ page }) => {
  const request = task();
  const workflow = { notifications: [{ id: 'n', request_id: request.id, body: 'Your task was updated', read_at: null, created_at: new Date().toISOString() }] };
  await mockSupabase(page, { signedIn: true, requests: [request, task({ id: 'old', title: 'Expired task', deadline: '2020-01-01T00:00:00Z' })], workflow });
  await page.goto('/dashboard');
  await expect(page.getByText('Expired task', { exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('nothing matches');
  await expect(page.getByText('Market delivery', { exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search tasks' }).fill('market');
  await expect(page.getByText('Market delivery', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Category: Groceries', exact: true }).click();
  await expect(page.getByText('Market delivery', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open notifications, 1 unread' }).click();
  await expect(page.getByText('Your task was updated')).toBeVisible();
  await page.getByRole('button', { name: 'View request' }).click();
  await expect(page).toHaveURL(/\/suyo\?id=task-1$/);
  expect(workflow.notifications[0].read_at).toBeTruthy();
});

test('automatic GPS selects a pin and quick deadline chooses a future date', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.07, longitude: 125.6 });
  await mockSupabase(page, { signedIn: true });
  await page.goto('/post-suyo');
  await expect(page.getByLabel('Selected task coordinates')).toContainText('7.07000, 125.60000');
  await page.getByRole('button', { name: 'In 1 hour', exact: true }).click();
  const value = await page.getByLabel('Deadline', { exact: true }).inputValue();
  expect(new Date(value).getTime()).toBeGreaterThan(Date.now() + 3500000);
});
