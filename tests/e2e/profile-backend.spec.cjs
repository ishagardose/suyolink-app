const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const self = '11111111-1111-4111-8111-111111111111';

test('profile ignores sample navigation data and persists metadata to the backend', async ({
  page,
}) => {
  const calls = await mockSupabase(page, { signedIn: true });
  await page.goto('/account?done=48&rating=4.9&name=Fake&phone=123&bio=Fake');
  await expect(page.getByText('Request Tester', { exact: true })).toBeVisible();
  await expect(
    page.getByText('No ratings yet', { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText('No bio yet.', { exact: true })).toBeVisible();
  await expect(page.getByText('48', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.getByLabel('Handle', { exact: true }).fill('@real_neighbor');
  await page.getByLabel('Bio', { exact: true }).fill('My saved bio');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(
    page.getByText('Your profile has been updated.', { exact: true }),
  ).toBeVisible();
  expect(
    calls.some(
      (c) =>
        c.path === '/rest/v1/profiles' &&
        c.body?.handle === '@real_neighbor' &&
        c.body?.bio === 'My saved bio',
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByText('@real_neighbor', { exact: true })).toBeVisible();
  await expect(page.getByText('My saved bio', { exact: true })).toBeVisible();
});

test('profile displays server stats and public profiles never use the viewer phone', async ({
  page,
}) => {
  const calls = await mockSupabase(page, {
    signedIn: true,
    requests: [
      {
        id: 'completed-1',
        requester_id: self,
        provider_id: 'other',
        status: 'completed',
      },
    ],
    workflow: {
      ratings: [
        {
          id: 'r1',
          provider_id: self,
          score: 3,
          comment: 'Real review',
          reviewerName: 'Reviewer',
        },
      ],
    },
  });
  await page.goto('/account?done=48&rating=4.9');
  await expect(page.getByText('1', { exact: true })).toBeVisible();
  await expect(page.getByText('3.0', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Real review', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Profile', exact: true }).click();
  await page.getByLabel('Phone', { exact: true }).fill('+639171112222');
  await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
  await expect(
    page.getByText('Your profile has been updated.', { exact: true }),
  ).toBeVisible();
  calls.length = 0;
  await page.goto('/profile?userId=other&phone=FAKE&done=999&rating=5');
  await expect(page.getByText('Other Neighbor', { exact: true })).toBeVisible();
  await expect(page.getByText('+639171112222', { exact: true })).toHaveCount(0);
  await expect(page.getByText('FAKE', { exact: true })).toHaveCount(0);
  await expect(page.getByText('999', { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Edit Profile', exact: true }),
  ).toHaveCount(0);
  expect(
    calls.some(
      (c) =>
        c.path === '/rest/v1/profile_contacts' && c.query.includes('other'),
    ),
  ).toBe(false);
});
