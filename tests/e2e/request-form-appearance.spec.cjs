const { test, expect } = require('@playwright/test');
const { mockSupabase } = require('./supabase-fixture.cjs');
const { light, dark } = require('../../theme/colors.js');
const rgb = (hex) =>
  'rgb(' +
  hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16))
    .join(', ') +
  ')';
for (const mode of ['light', 'dark']) {
  for (const width of [320, 390]) {
    test(
      'completion deadline fits and works in ' + mode + ' at ' + width + 'px',
      async ({ page }) => {
        await page.setViewportSize({ width, height: 844 });
        await mockSupabase(page, { signedIn: true });
        await page.addInitScript(
          (mode) => localStorage.setItem('@suyolink/theme', mode),
          mode,
        );
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('/post-suyo');
        const palette = mode === 'dark' ? dark : light;
        const heading = page.getByText('Completion Deadline', { exact: true });
        await expect(heading).toHaveCSS('color', rgb(palette.text));
        const card = heading.locator('..').locator('..');
        await expect(card).toHaveCSS('background-color', rgb(palette.card));
        const options = card.getByRole('radio');
        await expect(options).toHaveCount(5);
        const boxes = [];
        for (const option of await options.all()) {
          const box = await option.boundingBox();
          expect(box.width).toBeGreaterThan(70);
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
          boxes.push(box);
        }
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i],
              b = boxes[j];
            expect(
              a.x + a.width <= b.x + 1 ||
                b.x + b.width <= a.x + 1 ||
                a.y + a.height <= b.y + 1 ||
                b.y + b.height <= a.y + 1,
            ).toBe(true);
          }
        await card
          .getByRole('radio', { name: 'Urgent priority', exact: true })
          .click();
        await expect(
          card.getByRole('radio', { name: 'Urgent priority', exact: true }),
        ).toHaveAttribute('aria-checked', 'true');
        await page
          .getByLabel('Target date', { exact: true })
          .fill('2099-12-31');
        await page.getByLabel('Target time', { exact: true }).fill('12:30');
        await expect(
          card.getByText('Scheduled Deadline: 2099-12-31 at 12:30'),
        ).toBeVisible();
        for (const label of ['Target date', 'Target time']) {
          const input = page.getByLabel(label, { exact: true });
          await expect(input).toHaveCSS('color', rgb(palette.text));
          const box = await input.boundingBox();
          expect(box.width).toBeGreaterThan(70);
          expect(box.x + box.width).toBeLessThanOrEqual(width);
        }
        await page
          .getByRole('button', {
            name: 'Open calendar date setter',
            exact: true,
          })
          .click();
        await page.getByLabel('Close calendar', { exact: true }).click();
        await page
          .getByRole('button', { name: 'Open clock time setter', exact: true })
          .click();
        await page.getByLabel('Close clock', { exact: true }).click();
        await expect(page.getByText('Clock Time Setter', { exact: true })).toBeHidden();
        await card.screenshot({
          path: '.cache/deadline-' + mode + '-' + width + '.png',
        });
        expect(errors).toEqual([]);
      },
    );
  }
}
