const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

const notice = (id, body, extra = {}) => ({
  id,
  body,
  kind: 'status_update',
  read_at: null,
  request_id: null,
  created_at: new Date().toISOString(),
  ...extra,
});
async function openInbox(page, count) {
  await page
    .getByRole('button', {
      name: `Open notifications, ${count} unread`,
      exact: true,
    })
    .click();
  return page.getByRole('dialog', { name: 'Notifications', exact: true });
}

test('existing dashboard inbox uses real data and persists read and delete actions', async ({
  page,
}) => {
  const calls = await mockSupabase(page, {
    signedIn: true,
    workflow: {
      notifications: [
        notice('n1', 'Actual task update'),
        notice('n2', 'Second real update'),
      ],
    },
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dashboard');
  let dialog = await openInbox(page, 2);
  await expect(
    dialog.getByText('Actual task update', { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText('Reward Credited', { exact: true }),
  ).toHaveCount(0);
  await page.waitForTimeout(350); // Let the existing slide animation settle for visual QA.
  await page.screenshot({ path: '.cache/backend-notifications-populated.png' });
  await dialog
    .getByRole('button', { name: 'Mark read', exact: true })
    .first()
    .click();
  await expect(dialog.getByText('Unread (1)', { exact: true })).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Mark all notifications read', exact: true })
    .click();
  await expect(dialog.getByText('Unread (0)', { exact: true })).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Remove notification', exact: true })
    .first()
    .click();
  await expect(
    dialog.getByText('Actual task update', { exact: true }),
  ).toHaveCount(0);
  await page.reload();
  dialog = await openInbox(page, 0);
  await expect(dialog.getByText('All (1)', { exact: true })).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Clear all notifications', exact: true })
    .click();
  await expect(
    dialog.getByText('No notifications', { exact: true }),
  ).toBeVisible();
  expect(
    calls.some((c) => c.path === '/rest/v1/notifications' && c.body?.read_at),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: '.cache/backend-notifications-empty.png' });
});

test('failed notification deletion restores the card and reports the error', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    workflow: {
      notifications: [notice('n1', 'Keep this notification')],
      notificationWriteError: true,
    },
  });
  await page.goto('/dashboard');
  const dialog = await openInbox(page, 1);
  await dialog
    .getByRole('button', { name: 'Remove notification', exact: true })
    .click();
  await expect(dialog.getByRole('alert')).toHaveText(
    'Notification update denied',
  );
  await expect(
    dialog.getByText('Keep this notification', { exact: true }),
  ).toBeInViewport();
  await expect(dialog.getByText('All (1)', { exact: true })).toBeVisible();
});

test('notification opens its real request and saves read status', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      {
        id: 'task-1',
        requester_id: 'another-user',
        title: 'Actual notification task',
        details: 'Task details',
        category: 'Delivery',
        offer_centavos: 10000,
        deadline: '2099-12-31T12:00:00Z',
        status: 'open',
        location: 'Town center',
      },
    ],
    workflow: {
      notifications: [
        notice('n1', 'Open the actual task', { request_id: 'task-1' }),
      ],
    },
  });
  await page.goto('/dashboard');
  const dialog = await openInbox(page, 1);
  await dialog
    .getByRole('button', {
      name: 'Task Update: Open the actual task',
      exact: true,
    })
    .click();
  await expect(page).toHaveURL(/\/suyo\?id=task-1$/);
  await expect(
    page.getByText('Actual notification task', { exact: true }).first(),
  ).toBeVisible();
});
