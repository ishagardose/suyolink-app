const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const me = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const task = (id, extra = {}) => ({
  id,
  title: id,
  requester_id: other,
  provider_id: null,
  details: 'Task details',
  category: 'Groceries',
  location: 'Market',
  latitude: 7.07,
  longitude: 125.6,
  offer_centavos: 10000,
  deadline: '2099-12-31T10:30:00Z',
  status: 'open',
  created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  requester: { full_name: 'Request Tester' },
  ...extra,
});
test('available board excludes own and expired requests and uses real posting age', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      task('My active request', { requester_id: me }),
      task('My overdue request', {
        requester_id: me,
        deadline: '2020-01-01T10:30:00Z',
      }),
      task('Other overdue request', { deadline: '2020-01-01T10:30:00Z' }),
      task('Other older request'),
    ],
  });
  await page.goto('/dashboard');
  await expect(
    page.getByText('Other older request', { exact: true }),
  ).toBeVisible();
  for (const title of [
    'My active request',
    'My overdue request',
    'Other overdue request',
  ])
    await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Posted 4 days ago/)).toBeVisible();
  // A different requester with the same display name is still a public task.
  await page.getByText('Other older request', { exact: true }).click();
  await expect(page.getByText('Fulfill Suyo', { exact: true })).toBeVisible();
  await page.goto('/dashboard');
  await page.getByText('MySuyo', { exact: true }).click();
  await expect(
    page.getByText('My active request', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('My overdue request', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Expired', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Overdue:/)).toBeVisible();
  await expect(page.getByText('Just now', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Other older request', { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: '.cache/my-suyo-overdue.png', fullPage: true });
});
test('a request disappears when its deadline passes while the board stays open', async ({
  page,
}) => {
  const now = Date.now();
  await page.clock.install({ time: new Date(now) });
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      task('Deadline approaching', {
        deadline: new Date(now + 20000).toISOString(),
      }),
    ],
  });
  await page.goto('/dashboard');
  await expect(
    page.getByText('Deadline approaching', { exact: true }),
  ).toBeVisible();
  await page.clock.fastForward(31000);
  await expect(
    page.getByText('Deadline approaching', { exact: true }),
  ).toHaveCount(0);
});
