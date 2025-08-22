// test.spec.ts
import { test, expect } from '@playwright/test';

test('Add 2 products to Demoblaze cart in 4 steps', async ({ page }) => {
  // ---------------- Step 1: Open the site ----------------
  await page.goto('https://www.demoblaze.com/');
  await expect(page.locator('#tbodyid .card').first()).toBeVisible();
  console.log('✅ Step 1 passed: Site opened successfully');

  // ---------------- Step 2: Add Product 1 ----------------
  await page.getByText('Samsung galaxy s6', { exact: true }).click();
  const d1 = page.waitForEvent('dialog');                   // wait for popup
  await page.getByRole('link', { name: 'Add to cart', exact: true }).click();
  const alert1 = await d1;
  expect(alert1.message()).toBe('Product added');            // check message
  await alert1.accept();                                     // close popup
  await page.locator('#nava').click();                      // click logo to go home
  console.log('✅ Step 2 passed: Samsung galaxy s6 added');

  // ---------------- Step 3: Add Product 2 ----------------
  await page.getByRole('link', { name: 'Laptops', exact: true }).click();
  await page.getByText('MacBook air', { exact: true }).click();
  const d2 = page.waitForEvent('dialog');
  await page.getByRole('link', { name: 'Add to cart', exact: true }).click();
  const alert2 = await d2;
  expect(alert2.message()).toBe('Product added');
  await alert2.accept();
  console.log('✅ Step 3 passed: MacBook air added');

  // ---------------- Step 4: Check cart ----------------
  await page.locator('#cartur').click();
  const rows = page.locator('#tbodyid > tr');
  await expect(rows).toHaveCount(2, { timeout: 15000 });     // wait until 2 rows

  const names = await rows.locator('td:nth-child(2)').allTextContents();
  expect(names).toContain('Samsung galaxy s6');
  expect(names).toContain('MacBook air');
  console.log('✅ Step 4 passed: Both products are in the cart');

  // ---------------- Step 5: place order ----------------
  await page.getByRole('button', { name: 'Place Order' }).click();;
  console.log('✅ Step 4 passed: Place order made');

   // ---------------- Step 6: Encode Information of order ----------------
  await expect (page.locator('#orderModal')).toBeVisible();
  await page.locator('#totalm').fill('1');
  await page.locator('#country').fill('Philippines');
  await page.locator('#city').fill('Mandaluyong');
  await page.locator('#card').fill('12345677889');
  await page.locator('#month').fill('August');
  await page.locator('#year').fill('2025');
  await page.waitForTimeout(5000); // waits 5 seconds
  await page.getByRole('button', { name: 'Purchase' }).click();;
  await page.waitForTimeout(5000); // waits 5 seconds
  await expect(page.getByText('Thank you for your purchase!')).toBeVisible;
  await page.getByRole('button', { name: 'OK' }).click();;
  await page.waitForTimeout(5000); // waits 5 seconds
  console.log('✅ Step 4 passed: Encoding of order Information');
});