import { test, expect } from '@playwright/test';

test('login to Rahul Shetty Academy', async ({ page }) => {
   // login
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await expect(page.locator('#userEmail')).toBeVisible();
  await page.locator('#userEmail').fill('mierrolan@gmail.com');
  await page.locator('#userPassword').fill('Abdcd@247');
  await page.click('#login');

  // wait for either success (product cards) or an error toast
  const products = page.locator('.card-body');
  await expect(products.first()).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveURL(/\/client/);
});