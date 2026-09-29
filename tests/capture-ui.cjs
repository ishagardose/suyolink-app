const { chromium } = require('playwright');
const { mockSupabase } = require('./e2e/supabase-fixture.cjs');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
    const page = await context.newPage();
    const base = { requester_id: 'demo-user', provider_id: null, status: 'open', category: 'Groceries', offer_centavos: 15000,
      deadline: new Date(Date.now() + 86400000).toISOString(), location: 'Community market', notes: '', details: 'Pick up a few essentials and bring them to the gate.', requester: { full_name: 'Ana' }, latitude: 7.07, longitude: 125.6 };
    await mockSupabase(page, { signedIn: true, requests: [
      { ...base, id: 'demo-1', title: 'A quick grocery run' },
      { ...base, id: 'demo-2', title: 'Pick up a parcel', category: 'Delivery', offer_centavos: 10000, location: 'Town center' },
    ] });
    fs.mkdirSync('docs/ui-preview', { recursive: true });
    await page.goto('http://127.0.0.1:4173/dashboard');
    await page.getByText('A quick grocery run', { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/ui-preview/dashboard-light.png' });
    await page.getByRole('button', { name: 'Open task A quick grocery run' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'docs/ui-preview/task-cards.png' });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.getByText('A quick grocery run', { exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/ui-preview/dashboard-dark.png' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    await page.getByText('A quick grocery run', { exact: true }).waitFor();
    await page.screenshot({ path: 'docs/ui-preview/dashboard-desktop.png' });
    const auth = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
    const authPage = await auth.newPage();
    await mockSupabase(authPage);
    await authPage.goto('http://127.0.0.1:4173/signup');
    await authPage.getByLabel('Confirm Password', { exact: true }).waitFor();
    await authPage.evaluate(() => document.fonts.ready);
    await authPage.waitForFunction(() => {
      let element = document.querySelector('[aria-label="Confirm Password"]');
      if (!element) return false;
      while (element) {
        if (Number(getComputedStyle(element).opacity) < 1) return false;
        element = element.parentElement;
      }
      return true;
    });
    await authPage.screenshot({ path: 'docs/ui-preview/signup.png' });
    console.log('Saved five UI previews to docs/ui-preview (sample data only).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
