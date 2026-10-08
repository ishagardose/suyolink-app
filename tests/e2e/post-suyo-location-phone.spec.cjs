const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('posting requires a chosen pin and keeps the normalized phone and directions private', async ({
  page,
}) => {
  const calls = await mockSupabase(page, { signedIn: true });
  await page.goto('/post-suyo');
  await page
    .getByPlaceholder('e.g. Drop off documents - Unit 402', { exact: true })
    .fill('Deliver documents');
  await page.getByPlaceholder('150.00', { exact: true }).fill('150');
  await page.getByPlaceholder('YYYY-MM-DD', { exact: true }).fill('2099-12-31');
  await page.getByPlaceholder('HH:mm', { exact: true }).fill('12:30');
  await page
    .getByLabel('Public area', { exact: true })
    .fill('Buhangin, Davao City');
  await page
    .getByLabel('Exact address', { exact: true })
    .fill('Private gate 402');
  await page
    .getByLabel('Contact phone', { exact: true })
    .fill('+63 917 842 1983');
  await expect(page.getByLabel('Contact phone', { exact: true })).toHaveValue(
    '9178421983',
  );
  await page.getByLabel('Remarks', { exact: true }).fill('Keep receipt');
  const submit = page.getByRole('button', {
    name: 'Post request',
    exact: true,
  });
  await submit.click();
  await expect(
    page.getByText('Choose the exact location on the map', { exact: true }),
  ).toBeVisible();
  expect(
    calls.filter((c) => c.path.includes('create_suyo_request')),
  ).toHaveLength(0);
  await page.getByTestId('task-map').click({ position: { x: 100, y: 100 } });
  await submit.click();
  await expect(
    page.getByText('Suyo Posted Successfully!', { exact: true }),
  ).toBeVisible();
  const posted = calls.find(
    (c) => c.path === '/rest/v1/rpc/create_suyo_request_v2',
  ).body;
  expect(posted.p_contact_phone).toBe('+639178421983');
  expect(posted.p_public_location).toBe('Buhangin, Davao City');
  expect(posted.p_exact_address).toBe('Private gate 402');
  expect(posted.p_notes).toContain('Keep receipt');
  expect(posted.p_notes).not.toMatch(/9178421983|Private gate/);
  expect(posted.p_latitude).toEqual(expect.any(Number));
  expect(posted.p_longitude).toEqual(expect.any(Number));
});

test('region, city and barangay selection fills the public area', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.route('https://psgc.cloud/api/v2/**', (route) => {
    const path = new URL(route.request().url()).pathname;
    const json = path.endsWith('/regions')
      ? [{ code: '11', name: 'Davao Region' }]
      : path.endsWith('/cities-municipalities')
        ? [{ code: '11024', name: 'Davao City' }]
        : [{ code: '11024001', name: 'Buhangin' }];
    return route.fulfill({ json });
  });
  await page.goto('/post-suyo');
  await page
    .getByRole('button', { name: 'Choose Region', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select Davao Region', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select Davao City', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select Buhangin', exact: true })
    .click();
  await expect(page.getByLabel('Public area', { exact: true })).toHaveValue(
    'Buhangin, Davao City, Davao Region',
  );
});
