import { test, expect } from '@playwright/test';

test('add to cart Rahul Shetty Academy', async ({ page }) => {
   // login
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await expect(page.locator('#userEmail')).toBeVisible();
  await page.locator('#userEmail').fill('mierrolan@gmail.com');
  await page.locator('#userPassword').fill('Abdcd@247');
  await page.click('#login');

// Wait for products grid (logged-in dashboard)
const productCard = page.locator('.card-body').first();
await expect(productCard).toBeVisible();
// search item
await page.locator('ADIDAS ORIGINAL').fill;
await page.locator('input[placeholder="search"], input[name="search"]').press('Enter');


});