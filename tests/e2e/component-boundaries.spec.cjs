const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

const actorId = '11111111-1111-4111-8111-111111111111';
const task = (id, title, extra = {}) => ({
  id,
  title,
  requester_id: 'another-user',
  provider_id: null,
  details: 'Deliver the groceries to the community desk.',
  category: 'Groceries',
  offer_centavos: 12500,
  deadline: '2099-12-31T12:00:00Z',
  location: 'Community market',
  latitude: 7.07,
  longitude: 125.6,
  status: 'open',
  created_at: '2026-10-04T12:00:00Z',
  ...extra,
});

function errorsOn(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('dashboard tabs retain search state and real records open the extracted detail dialog', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      task('browse', 'Nearby groceries'),
      task('mine', 'My grocery request', { requester_id: actorId }),
    ],
  });
  const errors = errorsOn(page);
  await page.goto('/dashboard');
  const search = page.getByLabel('Search suyos', { exact: true });
  await search.fill('Nearby');
  await expect(
    page.getByText('Nearby groceries', { exact: true }),
  ).toBeVisible();
  await page.getByText('MySuyo', { exact: true }).click();
  await expect(
    page.getByText('My grocery request', { exact: true }),
  ).toBeVisible();
  await page.getByText('Doer Suyo', { exact: true }).click();
  await expect(
    page.getByText('Suyos Done as Doer', { exact: true }),
  ).toBeVisible();
  await page.getByText('Home', { exact: true }).click();
  await expect(search).toHaveValue('Nearby');
  await page.getByText('Nearby groceries', { exact: true }).click();
  await expect(
    page.getByText('Deliver the groceries to the community desk.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Fulfill Suyo', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('request sections retain draft, picker state, and attachments after validation', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  const errors = errorsOn(page);
  await page.goto('/post-suyo');
  const title = page.getByPlaceholder('e.g. Drop off documents - Unit 402', {
    exact: true,
  });
  const reward = page.getByPlaceholder('150.00', { exact: true });
  await title.fill('Refactor regression request');
  await reward.fill('250.50');
  const chooser = page.waitForEvent('filechooser');
  await page.getByText('Attach File', { exact: true }).click();
  await (
    await chooser
  ).setFiles({
    name: 'receipt.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Receipt for test delivery'),
  });
  await expect(page.getByText('receipt.txt', { exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: 'Open calendar date setter', exact: true })
    .click();
  await page.getByLabel('Close calendar', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Open clock time setter', exact: true })
    .click();
  await page.getByLabel('Close clock', { exact: true }).click();
  await page.getByText(/Post Suyo Request .*250.50/).click();
  await expect(
    page.getByText('Contact info is required to post a suyo', { exact: true }),
  ).toBeVisible();
  await expect(title).toHaveValue('Refactor regression request');
  await expect(reward).toHaveValue('250.50');
  await expect(page.getByText('receipt.txt', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('fulfillment routes keep timeline and proof input connected', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 7.07, longitude: 125.6 });
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      task('assigned', 'Assigned groceries', {
        provider_id: actorId,
        status: 'assigned',
      }),
    ],
  });
  const errors = errorsOn(page);
  await page.goto('/fulfill?id=assigned');
  await expect(
    page.getByText('Task Fulfillment', { exact: true }),
  ).toBeVisible();
  await page.getByText('Mark Complete & Upload Proof', { exact: true }).click();
  await expect(
    page.getByText('Upload Delivery Proof', { exact: true }),
  ).toBeVisible();
  const notes = page.getByPlaceholder(
    'e.g. Left with reception, handed directly to recipient...',
    { exact: true },
  );
  await notes.fill('Delivered to the reception desk.');
  await expect(notes).toHaveValue('Delivered to the reception desk.');
  await page.goto('/requester-fulfill?id=assigned');
  await expect(
    page.getByText('Suyo Request Fulfillment', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('rating and transaction route entries render after screen extraction', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  const errors = errorsOn(page);
  await page.goto('/rate-doer');
  await expect(page.getByText('Submit Rating', { exact: true })).toBeVisible();
  await page.getByText('Punctual Delivery', { exact: true }).click();
  await page.goto('/transactions');
  await expect(
    page.getByText('Transaction history', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
