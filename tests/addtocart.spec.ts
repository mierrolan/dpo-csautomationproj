// test.spec.ts
import { test, expect } from '@playwright/test';

test('Add items to cart on Demoblaze', async ({ page }) => {
  await page.goto('https://www.demoblaze.com/');

  // Helper: wait for the product grid to be visible
  const waitForGrid = async () => {
    await expect(page.locator('#tbodyid .card').first()).toBeVisible();
  };

  // --- Add Samsung galaxy s6 ---
  await page.getByText('Samsung galaxy s6', { exact: true }).click();
  const d1 = page.waitForEvent('dialog');
  await page.getByRole('link', { name: 'Add to cart', exact: true }).click();
  const alert1 = await d1;
  expect(alert1.message()).toBe('Product added');
  await alert1.accept();

  // Go "Home" via site logo (more reliable than the "Home" link text)
  await page.locator('#nava').click();
  await waitForGrid();

  // --- Add MacBook air (Laptops) ---
  await page.getByRole('link', { name: 'Laptops', exact: true }).click();
  await page.getByText('MacBook air', { exact: true }).click();
  const d2 = page.waitForEvent('dialog');
  await page.getByRole('link', { name: 'Add to cart', exact: true }).click();
  const alert2 = await d2;
  expect(alert2.message()).toBe('Product added');
  await alert2.accept();

  // --- Go to cart (unique id) ---
  await page.locator('#cartur').click();

  // Wait for cart rows to load (XHR)
  const rows = page.locator('#tbodyid > tr');
  await expect(rows).not.toHaveCount(0, { timeout: 15000 });

  // Verify product names (2nd column)
  const names = await rows.locator('td:nth-child(2)').allTextContents();
  const lower = names.map(n => n.trim().toLowerCase());
  expect(lower).toContain('samsung galaxy s6');
  expect(lower).toContain('macbook air');
});