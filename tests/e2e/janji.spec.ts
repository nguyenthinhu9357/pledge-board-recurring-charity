import { expect, test } from '@playwright/test';

test('landing page renders hero and CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('cta-dashboard')).toBeVisible();
  await expect(page.getByTestId('cta-pledge')).toBeVisible();
});

test('dashboard shows seeded charity, stats and pledge grid', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('charity-name')).toBeVisible();
  await expect(page.getByTestId('stat-rate')).toBeVisible();
  await expect(page.getByTestId('live-rate')).toBeVisible();
  await expect(page.getByTestId('pledge-grid')).toBeVisible();
  const cards = page.getByTestId('pledge-card');
  expect(await cards.count()).toBeGreaterThan(0);
});

test('new pledge form renders and produces a SEP-7 QR', async ({ page }) => {
  await page.goto('/pledge/new');
  await expect(page.getByTestId('pledge-form')).toBeVisible();
  const nameInput = page.getByTestId('input-name');
  await nameInput.click();
  await nameInput.fill('E2E Donor');
  await expect(nameInput).toHaveValue('E2E Donor');
  const amountInput = page.getByTestId('input-amount');
  await amountInput.fill('12.50');
  await expect(amountInput).toHaveValue('12.50');
  await page.getByTestId('submit-pledge').click();
  await expect(page.getByTestId('pledge-success')).toBeVisible({ timeout: 20000 });
  await expect(page.getByAltText('SEP-7 payment QR code')).toBeVisible();
});

test('wow moment: fulfilling a pledge flips badge and raises the live rate', async ({ page }) => {
  await page.goto('/dashboard');
  const rateText = await page.getByTestId('live-rate').innerText();
  const startRate = Number.parseInt(rateText.replace('%', ''), 10);

  const fulfillButtons = page.getByTestId('fulfill-btn');
  const count = await fulfillButtons.count();
  expect(count).toBeGreaterThan(0);

  // Fulfill enough active pledges to move the community rate measurably.
  const toClick = Math.min(count, 4);
  for (let i = 0; i < toClick; i++) {
    await fulfillButtons.nth(i).click();
    await expect(fulfillButtons.nth(i)).toContainText(/Give again/i, { timeout: 15000 });
  }

  await expect
    .poll(
      async () =>
        Number.parseInt((await page.getByTestId('live-rate').innerText()).replace('%', ''), 10),
      { timeout: 15000 },
    )
    .toBeGreaterThan(startRate);
});
