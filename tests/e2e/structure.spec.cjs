const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test.beforeEach(async ({ page }) => {
  await mockSupabase(page, { signedIn: true });
});

function captureErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('dashboard sections retain search, tab, notification and wallet state', async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.goto('/dashboard');
  const search = page.getByLabel('Search suyos', { exact: true });
  await search.fill('Mercury');
  await expect(
    page.getByText('Prescription pickup at Mercury Drug', { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText('Drop off documents - Unit 402', { exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'MySuyo', exact: true }).click();
  await page.getByRole('button', { name: 'Doer Suyo', exact: true }).click();
  await expect(
    page.getByText('Suyos Done as Doer', { exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(search).toHaveValue('Mercury');
  await page.getByRole('button', { name: /Open notifications/ }).click();
  await expect(page.getByText('Doer Assigned', { exact: true })).toBeVisible();
  await page.getByText('Done', { exact: true }).click();
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page.getByText('Wallet', { exact: true }).click();
  await page.getByText('Yearly', { exact: true }).click();
  await expect(page.getByText('Monthly', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('request field sections share the draft and retain values after validation', async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.goto('/post-suyo');
  const title = page.getByPlaceholder('e.g. Drop off documents - Unit 402', {
    exact: true,
  });
  const reward = page.getByPlaceholder('150.00', { exact: true });
  const phone = page.getByPlaceholder('e.g. 0917 842 1983', { exact: true });
  await title.fill('Component regression request');
  await reward.fill('250.50');
  await phone.fill('09171234567');
  await page.getByText(/Post Suyo Request .*250.50/).click();
  await expect(title).toHaveValue('Component regression request');
  await expect(reward).toHaveValue('250.50');
  await expect(phone).toHaveValue('09171234567');
  await expect(page).toHaveURL(/\/post-suyo$/);
  expect(errors).toEqual([]);
});

for (const [route, text] of [
  ['/fulfill', 'Task Fulfillment'],
  ['/requester-fulfill', 'Suyo Request Fulfillment'],
  ['/account', 'My Profile'],
  ['/submit-proof', 'Submit Proof of Suyo'],
  ['/rate-doer', 'Submit Rating'],
  ['/rate-requester', 'Submit Rating'],
  ['/activity', 'Yearly'],
]) {
  test(`extracted sections render on ${route}`, async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto(route);
    await expect(page.getByText(text, { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('account and rating dialogs update their parent screens', async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.goto('/account');
  await page.getByLabel('Edit Profile', { exact: true }).click();
  await page
    .getByPlaceholder('Enter full name', { exact: true })
    .fill('Updated Profile');
  await page.getByText('Save Changes', { exact: true }).click();
  await expect(
    page.getByText('Updated Profile', { exact: true })
  ).toBeVisible();
  await page.goto('/rate-doer');
  await page.getByLabel('5 stars', { exact: true }).click();
  await page.getByText('Submit Rating', { exact: true }).click();
  await expect(
    page.getByText('Rating Submitted!', { exact: true })
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('notification actions and fulfillment proof navigation remain connected', async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /Open notifications/ }).click();
  await page.getByText('Mark read', { exact: true }).click();
  await expect(page.getByText('Unread (0)', { exact: true })).toBeVisible();
  await page.goto('/fulfill');
  await page.getByText('Mark Complete & upload proof', { exact: true }).click();
  await expect(page).toHaveURL(/\/submit-proof\?/);
  await expect(
    page.getByText('Submit Proof of Suyo', { exact: true })
  ).toBeVisible();
  await page
    .getByPlaceholder('e.g. Handed grocery bags to recipient at unit doorstep.')
    .fill('Delivered to reception.');
  expect(errors).toEqual([]);
});

test('grouped routes preserve public URLs and browser back navigation', async ({
  page,
}) => {
  const errors = captureErrors(page);
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Post', exact: true }).click();
  await expect(page).toHaveURL(/\/post-suyo$/);
  await expect(
    page.getByPlaceholder('e.g. Drop off documents - Unit 402')
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByLabel('Search suyos', { exact: true })).toBeVisible();
  for (const [route, label] of [
    ['/profile', 'My Profile'],
    ['/wallet', 'Yearly'],
    ['/login', 'Email Address'],
    ['/signup', 'Confirm Password'],
  ]) {
    await page.goto(route);
    if (route === '/login' || route === '/signup')
      await expect(page.getByLabel(label, { exact: true })).toBeVisible();
    else await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(route + '$'));
  }
  expect(errors).toEqual([]);
});

test('location setup still guards grouped task routes', async ({ page }) => {
  const errors = captureErrors(page);
  await page.addInitScript(() =>
    localStorage.removeItem(
      '@suyolink/location/11111111-1111-4111-8111-111111111111'
    )
  );
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/set-location$/);
  await expect(
    page.getByRole('button', { name: 'Use my current location' })
  ).toBeVisible();
  await page.goto('/account');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('My Profile', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
