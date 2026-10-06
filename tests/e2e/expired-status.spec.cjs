const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

test('past-deadline open tasks show Expired on the card and in details', async ({
  page,
}) => {
  await mockSupabase(page, {
    signedIn: true,
    requests: [
      {
        id: 'expired-task',
        requester_id: '11111111-1111-4111-8111-111111111111',
        provider_id: null,
        title: 'Clean house',
        details: 'Clean the living room',
        category: 'Household',
        offer_centavos: 1000000,
        deadline: '2020-09-30T15:21:00Z',
        location: 'City center',
        notes: '',
        status: 'open',
        created_at: '2020-09-29T12:00:00Z',
      },
    ],
  });
  await page.goto('/dashboard?tab=mysuyo');
  await expect(page.getByText('Expired', { exact: true })).toBeVisible();
  const card = page
    .getByText('Expired', { exact: true })
    .locator('..')
    .locator('..')
    .locator('..');
  await expect(card.getByText('Open', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'View details', exact: true }).click();
  await expect(page).toHaveURL(/suyo\?id=expired-task$/);
  await expect(page.getByText('Expired', { exact: true }).last()).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Accept task', exact: true }),
  ).toHaveCount(0);
});
