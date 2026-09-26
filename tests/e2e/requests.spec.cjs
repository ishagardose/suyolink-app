const { test, expect } = require('@playwright/test');
const KEY = '@suyolink/requests-v1';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('@suyolink/mock-user', JSON.stringify({
      name: 'Request Tester', email: 'requester@example.com', phone: '', address: '',
    }));
  });
});
async function fillForm(page) {
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Pick up groceries');
  await page.getByRole('textbox', { name: 'Task details', exact: true }).fill('Buy rice and eggs.');
  await page.getByRole('button', { name: 'Groceries category' }).click();
  await page.getByRole('textbox', { name: 'Offer amount (PHP)', exact: true }).fill('150.25');
  await page.getByRole('textbox', { name: 'Deadline', exact: true }).fill('2099-12-31 18:30');
  await page.getByRole('textbox', { name: 'Location', exact: true }).fill('Davao City market');
  await page.getByRole('textbox', { name: 'Additional notes (optional)', exact: true }).fill('Call at the gate.');
}
test('post a real local request and restore it after refresh', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/dashboard');
  await expect(page.getByText('No suyos yet.', { exact: false })).toBeVisible();
  await expect(page.getByText('ACTIVE SUYO', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Post a Suyo', exact: true }).click();
  await expect(page).toHaveURL(/\/post-suyo$/);
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(page.getByText('Enter a title, task details, and location.')).toBeVisible();
  await fillForm(page);
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText('Pick up groceries', { exact: true })).toBeVisible();
  await expect(page.getByText('₱150.25', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Pick up groceries', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Show details for Pick up groceries' }).click();
  await expect(page.getByText('Buy rice and eggs.', { exact: true })).toBeVisible();
  await expect(page.getByText('Notes: Call at the gate.', { exact: true })).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ status: 'open', offerCentavos: 15025, requesterEmail: 'requester@example.com' });
  expect(errors).toEqual([]);
});
test('write failures retain the form and allow retry without duplicates', async ({ page }) => {
  await page.goto('/post-suyo');
  await fillForm(page);
  await page.evaluate(() => {
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === '@suyolink/requests-v1') throw new Error('Storage full');
      return window.originalSetItem.call(this, key, value);
    };
  });
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(page.getByText('Could not save your request.', { exact: false })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Pick up groceries');
  await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
  await page.getByRole('button', { name: 'Post request', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).length, KEY)).toBe(1);
});
test('corrupt saved requests are preserved and posting is blocked', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, 'bad data'), KEY);
  await page.goto('/post-suyo');
  await expect(page.getByText('Could not load saved requests.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Post request', exact: true })).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe('bad data');
});
