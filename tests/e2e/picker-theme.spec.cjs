const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');

for (const theme of ['light', 'dark']) {
  test(`date and time pickers follow the ${theme} theme and keep selections`, async ({
    page,
  }) => {
    await mockSupabase(page, { signedIn: true });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/account');
    await page
      .getByRole('radio', {
        name: `${theme === 'light' ? 'Light' : 'Dark'} appearance`,
        exact: true,
      })
      .click();
    await page.goto('/post-suyo');
    const cardColor =
      theme === 'dark' ? 'rgb(28, 43, 34)' : 'rgb(255, 255, 255)';
    await page
      .getByRole('button', { name: 'Open calendar date setter', exact: true })
      .click();
    await expect(page.getByTestId('calendar-dialog')).toHaveCSS(
      'background-color',
      cardColor,
    );
    await page.getByText('Tomorrow', { exact: true }).click();
    const selectedDate = await page
      .getByTestId('calendar-dialog')
      .getByText(/^\d{4}-\d{2}-\d{2}$/)
      .textContent();
    await page.waitForTimeout(350); // Let the modal fade settle for visual review.
    await page.screenshot({ path: `.cache/calendar-${theme}.png` });
    await page.getByRole('button', { name: 'Set Date', exact: true }).click();
    await expect(page.getByLabel('Target date', { exact: true })).toHaveValue(
      selectedDate,
    );
    await page
      .getByRole('button', { name: 'Open clock time setter', exact: true })
      .click();
    await expect(page.getByTestId('clock-dialog')).toHaveCSS(
      'background-color',
      cardColor,
    );
    await page
      .getByRole('button', { name: 'Select hour 3', exact: true })
      .click();
    await page.getByText(':30', { exact: true }).click();
    await page.getByText('PM', { exact: true }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: `.cache/clock-${theme}.png` });
    await page.getByRole('button', { name: 'Set Time', exact: true }).click();
    await expect(page.getByLabel('Target time', { exact: true })).toHaveValue(
      '15:30',
    );
    await expect(
      page.getByRole('button', {
        name: 'Use my location for task pin',
        exact: true,
      }),
    ).toHaveCSS(
      'background-color',
      theme === 'dark' ? 'rgb(38, 59, 46)' : 'rgb(234, 242, 237)',
    );
    expect(errors).toEqual([]);
  });
}
