const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('notifications open over the dashboard, mark read, and preserve search on close', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    workflow: {
      notifications: [
        {
          id: 'notice-1',
          body: 'Your task has an update.',
          request_id: null,
          created_at: '2026-10-05T00:00:00Z',
          read_at: null,
        },
      ],
    },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dashboard');
  await page.getByLabel('Search suyos', { exact: true }).fill('groceries');
  await page
    .getByRole('button', { name: 'Notifications (1)', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Notifications', exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/dashboard$/);
  await page.getByRole('button', { name: 'Mark as read', exact: true }).click();
  await expect(page.getByText('Unread', { exact: true })).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Device notification settings', exact: true })
    .click();
  await expect(
    page.getByRole('button', {
      name: 'Enable device notifications',
      exact: true,
    }),
  ).toBeVisible();
  await page.waitForTimeout(350); // Capture the modal after its entrance fade.
  await page.screenshot({ path: '.cache/notifications-modal.png' });
  await page
    .getByRole('button', { name: 'Close notifications', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Notifications', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel('Search suyos', { exact: true })).toHaveValue(
    'groceries',
  );
  await expect(
    page.getByRole('button', { name: 'Notifications', exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('menu opens notifications over profile and the backdrop dismisses them', async ({
  page,
}) => {
  await mockSupabase(page, { signedIn: true });
  await page.goto('/account');
  await page.getByRole('button', { name: 'Open sidebar', exact: true }).click();
  await page
    .getByRole('button', { name: 'Notifications', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Notifications', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close menu', exact: true }),
  ).toHaveCount(0);
  await expect(page).toHaveURL(/account$/);
  await expect(
    page.getByText('No notifications yet.', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Close notifications backdrop', exact: true })
    .click({ position: { x: 5, y: 5 }, force: true });
  await expect(
    page.getByRole('dialog', { name: 'Notifications', exact: true }),
  ).toHaveCount(0);
});

test('opening a notification request closes the modal before navigation', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      {
        id: 'task-1',
        requester_id: 'another-user',
        status: 'open',
        title: 'Notification task',
        details: 'A short task',
        category: 'Delivery',
        offer_centavos: 10000,
        deadline: '2099-12-31T12:00:00Z',
        location: 'Town center',
      },
    ],
    workflow: {
      notifications: [
        {
          id: 'notice-2',
          request_id: 'task-1',
          body: 'View this task.',
          created_at: '2026-10-05T00:00:00Z',
          read_at: null,
        },
      ],
    },
  });
  await page.goto('/dashboard');
  await page
    .getByRole('button', { name: 'Notifications (1)', exact: true })
    .click();
  await page.getByRole('button', { name: 'View request', exact: true }).click();
  await expect(page).toHaveURL(/suyo\?id=task-1$/);
  await expect(
    page.getByRole('dialog', { name: 'Notifications', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText('Notification task', { exact: true }).first(),
  ).toBeVisible();
});

test('long notification lists scroll inside the modal on a small phone in dark mode', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await mockSupabase(page, {
    signedIn: true,
    workflow: {
      notifications: Array.from({ length: 25 }, (_, i) => ({
        id: `notice-${i}`,
        request_id: null,
        body: `Task update ${i + 1}`,
        created_at: '2026-10-05T00:00:00Z',
        read_at: null,
      })),
    },
  });
  await page.addInitScript(() =>
    localStorage.setItem('@suyolink/theme', 'dark'),
  );
  await page.goto('/dashboard');
  await page
    .getByRole('button', { name: 'Notifications (25)', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: 'Notifications',
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(350); // Let the opening animation and initial data restore settle.
  await page
    .getByText('Task update 25', { exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByText('Task update 25', { exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole('button', { name: 'Close notifications', exact: true }),
  ).toBeInViewport();
  const bounds = await dialog.boundingBox();
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(640);
  await page.screenshot({ path: '.cache/notifications-modal-dark.png' });
});
