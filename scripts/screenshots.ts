/**
 * Capture demo screenshots for Janji. Requires the dev server running on PORT (default 3001)
 * with seeded data. Outputs JPEGs to ../screen-shot.
 */
import { chromium, devices } from '@playwright/test';

const PORT = process.env.PORT ?? '3001';
const BASE = `http://localhost:${PORT}`;
const OUT = '../screen-shot';

async function main() {
  const browser = await chromium.launch();

  // Desktop context
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // 01 landing
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.screenshot({
    path: `${OUT}/01-landing.jpg`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });

  // 02 main dashboard (board with cards, stats, live rate)
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="pledge-grid"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/02-main.jpg`, type: 'jpeg', quality: 85, fullPage: true });

  // 03 action: new pledge form
  await page.goto(`${BASE}/pledge/new`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="pledge-form"]');
  await page.getByTestId('input-name').fill('Nguyen Thi Lan');
  await page.getByTestId('input-amount').fill('30.00');
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${OUT}/03-action.jpg`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });

  // 04 detail: submit to reveal SEP-7 QR + URI
  await page.getByTestId('submit-pledge').click();
  await page.waitForSelector('[data-testid="pledge-success"]', { timeout: 20000 });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: `${OUT}/04-detail.jpg`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });

  // 05 success / WOW: fulfill pledges -> badge flips + live rate climbs
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="fulfill-btn"]');
  const btns = page.getByTestId('fulfill-btn');
  const n = Math.min(await btns.count(), 3);
  for (let i = 0; i < n; i++) {
    await btns.nth(i).click();
    await btns
      .nth(i)
      .getByText(/Give again/i)
      .waitFor({ timeout: 15000 })
      .catch(() => {});
  }
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${OUT}/05-success.jpg`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });
  await ctx.close();

  // 06 mobile 375px dashboard
  const mctx = await browser.newContext({
    ...devices['iPhone 12'],
    viewport: { width: 375, height: 812 },
  });
  const mpage = await mctx.newPage();
  await mpage.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await mpage.waitForSelector('[data-testid="pledge-grid"]');
  await mpage.waitForTimeout(800);
  await mpage.screenshot({
    path: `${OUT}/06-mobile.jpg`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });
  await mctx.close();

  // 07 empty state: visit board with the empty-board flag (server reads ?empty=1)
  const ectx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const epage = await ectx.newPage();
  await epage.goto(`${BASE}/dashboard?empty=1`, { waitUntil: 'domcontentloaded' });
  await epage.waitForSelector('[data-testid="empty-state"]', { timeout: 10000 });
  await epage.waitForTimeout(500);
  await epage.screenshot({
    path: `${OUT}/07-empty-state.jpg`,
    type: 'jpeg',
    quality: 85,
    fullPage: true,
  });
  await ectx.close();

  await browser.close();
  console.log('[screenshots] done');
}

main().catch((e) => {
  console.error('[screenshots] failed:', e);
  process.exit(1);
});
