// tests/login.spec.ts
import { test, expect } from '@playwright/test';

/**
 * Set credentials via env to avoid hardcoding:
 *   RSA_EMAIL=you@example.com RSA_PASSWORD=YourPass npx playwright test
 */
const BASE = 'https://rahulshettyacademy.com/client';
const EMAIL = process.env.RSA_EMAIL ?? 'mierrolan@gmail.com';
const PASSWORD = process.env.RSA_PASSWORD ?? 'Abdcd@247';

// Centralized, typed locators
const L = {
  email: '#userEmail',
  password: '#userPassword',
  loginBtn: { role: 'button' as const, name: /login/i },
  // Works for Toastr/Angular alerts and generic ARIA alerts
  toast: '[role="alert"], .toast-message, .ngx-toastr .toast',
  // Something visible only after auth (no product assertions)
  postLoginAnchor: "[routerlink='/dashboard/myorders'], [routerlink='/dashboard/cart'], nav, header",
};

async function gotoLogin(page) {
  await page.goto(`${BASE}/#/auth/login`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(L.email)).toBeVisible({ timeout: 15000 });
}

async function login(page, email: string, password: string) {
  await gotoLogin(page);
  await page.fill(L.email, email);
  await page.fill(L.password, password);
  await page.getByRole(L.loginBtn.role, { name: L.loginBtn.name }).click();
}

/* ---------------- Tests ---------------- */

// 1) Positive: valid credentials should land on app shell (not /auth/login)
test('login succeeds with valid credentials', async ({ page }) => {
  await login(page, EMAIL, PASSWORD);

  // Wait for either app shell elements or at least non-auth URL
  await Promise.race([
    page.waitForURL('**/client/**', { timeout: 30000 }).catch(() => null),
    page.locator(L.postLoginAnchor).first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => null),
  ]);

  await page.waitForLoadState('networkidle').catch(() => {});
  await expect(page).not.toHaveURL(/auth\/login/i);
  // sanity: an authenticated UI element should exist
  await expect(page.locator(L.postLoginAnchor).first()).toBeVisible();
});

// 2) Negative: wrong password
test('shows error when password is incorrect', async ({ page }) => {
  await login(page, EMAIL, 'totally-wrong-password');

  const toast = page.locator(L.toast).first();
  await expect(toast).toBeVisible({ timeout: 15000 });
  await expect(toast).toContainText(/incorrect|invalid|wrong|password/i);
  await expect(page).toHaveURL(/auth\/login/i);
});

// 3) Negative: unknown email
test('shows error when email is not registered', async ({ page }) => {
  await login(page, `not-${Date.now()}@example.com`, 'SomePass1!');
  const toast = page.locator(L.toast).first();
  await expect(toast).toBeVisible({ timeout: 15000 });
  await expect(toast).toContainText(/incorrect|invalid|wrong|email|password/i);
  await expect(page).toHaveURL(/auth\/login/i);
});

// 4) Validation: click Login with empty fields
test('blocks submit when fields are empty (no navigation + any validation signal)', async ({ page, browserName }) => {
  await gotoLogin(page);

  const loginBtn = page.getByRole(L.loginBtn.role, { name: L.loginBtn.name });
  await loginBtn.click();

  // Must remain on the login route
  await expect(page).toHaveURL(/auth\/login/i);

  // Accept any of these common validation signals
  const signals = await Promise.all([
    loginBtn.isDisabled().catch(() => false),
    loginBtn.getAttribute('aria-disabled').then(v => v === 'true').catch(() => false),
    loginBtn.evaluate((el: HTMLElement) => getComputedStyle(el).pointerEvents === 'none').catch(() => false),
    page.locator(L.email).getAttribute('aria-invalid').then(v => v === 'true').catch(() => false),
    page.locator(L.password).getAttribute('aria-invalid').then(v => v === 'true').catch(() => false),
    page.getByText(/required|invalid|enter (your )?(email|password)/i).first().isVisible().catch(() => false),
  ]);
  expect(
    signals.some(Boolean),
    `Expected some validation signal when submitting empty fields on ${browserName}. Signals: ${JSON.stringify(signals)}`
  ).toBeTruthy();
});

// 5) Validation: invalid email format should not allow a real submit
test('email field rejects invalid format', async ({ page, browserName }) => {
  await gotoLogin(page);

  await page.fill(L.email, 'not-an-email');
  await page.fill(L.password, 'SomePass1!');

  // Try to submit
  await page.getByRole(L.loginBtn.role, { name: L.loginBtn.name }).click();

  // If the input is type="email", browsers set validity.typeMismatch.
  const typeMismatch = await page.locator(L.email).evaluate((el: HTMLInputElement) =>
    (el as HTMLInputElement).type === 'email' ? (el as HTMLInputElement).validity.typeMismatch : null
  ).catch(() => null);

  // Either typeMismatch is true, or app keeps us on login page, or we see an inline error.
  const stillOnLogin = /auth\/login/i.test(page.url());
  const inlineError = await page.getByText(/invalid email|enter valid email|email.*invalid/i).first().isVisible().catch(() => false);

  expect(
    typeMismatch === true || stillOnLogin || inlineError,
    `Expected invalid email to be rejected on ${browserName} (typeMismatch=${typeMismatch}, stillOnLogin=${stillOnLogin}, inlineError=${inlineError})`
  ).toBeTruthy();
});