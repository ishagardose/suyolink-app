const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

async function mockAreas(page) {
  const paths = [];
  await page.route('https://psgc.cloud/api/v2/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace(
      '/api/v2/',
      '',
    );
    paths.push(path);
    const data =
      path === 'regions'
        ? [{ code: '1100000000', name: 'Davao Region' }]
        : path.includes('cities-municipalities/')
          ? [{ code: '1130700001', name: 'Acacia' }]
          : [
              {
                code: '1130700000',
                name: 'City of Davao',
                province: 'Davao del Sur',
              },
              {
                code: '1121400000',
                name: 'City of Digos',
                province: 'Davao del Sur',
              },
            ];
    return route.fulfill({ json: { data } });
  });
  return paths;
}

async function chooseArea(page) {
  await page
    .getByRole('button', { name: 'Choose Region', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select Davao Region', exact: true })
    .click();
  await page.getByLabel('Search areas', { exact: true }).fill('davao');
  await page
    .getByRole('button', { name: 'Select City of Davao', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select Acacia', exact: true })
    .click();
}

test('pin and area choices allow posting without typing a private address', async ({
  page,
}) => {
  const calls = await mockSupabase(page, { signedIn: true });
  const paths = await mockAreas(page);
  await page.goto('/post-suyo');
  await page.getByLabel('Title', { exact: true }).fill('Pin-only pickup');
  await page
    .getByRole('button', { name: 'Groceries category', exact: true })
    .click();
  await page
    .getByLabel('Task details', { exact: true })
    .fill('Pick up groceries');
  await page.getByLabel('Reward amount', { exact: true }).fill('125');
  await page.getByLabel('Target date', { exact: true }).fill('2099-12-31');
  await page.getByLabel('Target time', { exact: true }).fill('12:30');
  await page.getByTestId('task-map').click({ position: { x: 100, y: 100 } });
  await chooseArea(page);
  await expect(page.getByLabel('Public area', { exact: true })).toHaveValue(
    'Acacia, City of Davao, Davao del Sur',
  );
  await expect(page.getByLabel('Exact address', { exact: true })).toHaveValue(
    '',
  );
  await page.getByLabel('Contact phone', { exact: true }).fill('9123456789');
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(
    page.getByText('Suyo Posted Successfully!', { exact: true }),
  ).toBeVisible();
  const body = calls.find(
    (call) => call.path === '/rest/v1/rpc/create_suyo_request_v2',
  ).body;
  expect(body.p_exact_address).toMatch(/^Selected map pin: /);
  expect(body.p_public_location).toBe('Acacia, City of Davao, Davao del Sur');
  expect(paths).toEqual([
    'regions',
    'regions/1100000000/cities-municipalities',
    'cities-municipalities/1130700000/barangays',
  ]);
});

test('changing the city removes the old barangay from the public area', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await mockAreas(page);
  await page.goto('/post-suyo');
  await chooseArea(page);
  await page
    .getByRole('button', { name: 'Choose City / municipality', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select City of Digos', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Close area picker', exact: true })
    .click();
  await expect(page.getByLabel('Public area', { exact: true })).toHaveValue(
    'City of Digos, Davao del Sur',
  );
  await expect(
    page.getByRole('button', { name: 'Choose Barangay', exact: true }),
  ).not.toContainText('Acacia');
  await page
    .getByRole('button', { name: 'Choose Region', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Select Davao Region', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Close area picker', exact: true })
    .click();
  await expect(page.getByLabel('Public area', { exact: true })).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Choose Barangay', exact: true }),
  ).toBeDisabled();
});

test('directory failures leave manual area entry and the pin usable', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.route('https://psgc.cloud/api/v2/**', (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  await page.goto('/post-suyo');
  await page
    .getByRole('button', { name: 'Choose Region', exact: true })
    .click();
  await expect(
    page.getByText(
      'Could not load areas. Retry or close and type your public area below.',
    ),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Close area picker', exact: true })
    .click();
  await page.getByLabel('Public area', { exact: true }).fill('City market');
  await page.getByTestId('task-map').click({ position: { x: 100, y: 100 } });
  await expect(page.getByLabel('Public area', { exact: true })).toHaveValue(
    'City market',
  );
  await expect(page.getByText('Pin Set', { exact: true })).toBeVisible();
});
