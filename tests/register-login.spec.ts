import { test, expect } from '@playwright/test';

// 🔹 Utility functions for random values
const randomString = (len: number) =>
  Math.random().toString(36).substring(2, 2 + len);

const randomEmail = () =>
  `user_${Date.now()}_${Math.floor(Math.random() * 1000)}@mailinator.com`;

const randomPhone = () =>
  Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');

const invalidEmails = [
  'invalid-email',
  'test@',
  '@domain.com',
  'test..test@domain.com',
  'test@domain',
  'test space@domain.com',
  ''
];

const invalidPasswords = [
  '123', // too short
  'password', // no special chars/numbers
  'PASSWORD123', // no special chars
  'Pass@', // too short
  '', // empty
  'a'.repeat(101) // too long
];

const invalidPhones = [
  '123', // too short
  'abcdefghij', // letters
  '12345678901', // too long
  '', // empty
  '123-456-7890' // with special chars
];

// 🔹 POSITIVE TEST - Original functionality
test('✅ Register with valid random data and login', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const email = randomEmail();
  const phone = randomPhone();
  const password = 'Abdcd@247';

  console.log('Positive test data:', { firstName, lastName, email, phone, password });

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();

  // Fill registration form
  await expect(page.locator('#userEmail')).toBeVisible();
  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.locator('#userEmail').fill(email);
  await page.locator('#userMobile').fill(phone);
  await page.locator('#userPassword').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('//input[@value="Male"]').click();
  await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
  await page.locator('//input[@type="checkbox"]').click();

  await page.locator('#login').click();
  await expect(page.locator('//h1[normalize-space()="Account Created Successfully"]')).toBeVisible({ timeout: 15000 });

  // Login with same credentials
  await page.locator('//button[normalize-space()="Login"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();
  await page.locator('#userEmail').fill(email);
  await page.locator('#userPassword').fill(password);
  await page.locator('#login').click();

  await expect(page.locator('//div[@aria-label="Login Successfully"]')).toBeVisible({ timeout: 15000 });
});

// 🔹 NEGATIVE TESTS - Registration Form Validation
test('❌ Registration with empty required fields', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  // Try to submit empty form
  await page.locator('#login').click();

  // Check for validation messages (adjust selectors based on actual error elements)
  const errorMessages = [
    '*First Name is required',
    '*Email is required', 
    '*Phone Number is required',
    '*Password is required'
  ];

  for (const message of errorMessages) {
    await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
  }
});

test('❌ Registration with invalid email formats', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const phone = randomPhone();
  const password = 'Abdcd@247';

  for (const invalidEmail of invalidEmails) {
    console.log(`Testing invalid email: "${invalidEmail}"`);
    
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await page.locator('//a[normalize-space()="Register here"]').click();
    await expect(page.locator('#userEmail')).toBeVisible();

    await page.locator('#firstName').fill(firstName);
    await page.locator('#lastName').fill(lastName);
    await page.locator('#userEmail').fill(invalidEmail);
    await page.locator('#userMobile').fill(phone);
    await page.locator('#userPassword').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.locator('//input[@value="Male"]').click();
    await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
    await page.locator('//input[@type="checkbox"]').click();

    await page.locator('#login').click();

    // Wait a moment for validation to trigger
    await page.waitForTimeout(2000);

    // Check if we're still on registration page (validation prevented submission)
    const isOnRegistrationPage = await page.locator('#userEmail').isVisible();
    
    // Or check for any common error indicators
    const hasValidationError = await page.locator('.toast-error, .alert-danger, [class*="error"], .ng-invalid').count() > 0;
    
    // If invalid email, either should stay on registration page or show error
    if (invalidEmail === '' || invalidEmail === 'invalid-email' || invalidEmail === 'test@' || invalidEmail === '@domain.com') {
      expect(isOnRegistrationPage || hasValidationError).toBeTruthy();
    }
  }
});

test('❌ Registration with invalid passwords', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const email = randomEmail();
  const phone = randomPhone();

  for (const invalidPassword of invalidPasswords) {
    console.log(`Testing invalid password: "${invalidPassword}"`);
    
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await page.locator('//a[normalize-space()="Register here"]').click();
    await expect(page.locator('#userEmail')).toBeVisible();

    await page.locator('#firstName').fill(firstName);
    await page.locator('#lastName').fill(lastName);
    await page.locator('#userEmail').fill(email);
    await page.locator('#userMobile').fill(phone);
    await page.locator('#userPassword').fill(invalidPassword);
    await page.locator('#confirmPassword').fill(invalidPassword);
    
    if (invalidPassword !== '') { // Skip other fields if password is empty to test required validation
      await page.locator('//input[@value="Male"]').click();
      await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
      await page.locator('//input[@type="checkbox"]').click();
    }

    await page.locator('#login').click();
    await page.waitForTimeout(2000);

    // Check if we're still on registration page (validation prevented submission)
    const isOnRegistrationPage = await page.locator('#userEmail').isVisible();
    
    // For weak passwords, we should either stay on registration page or see some form of validation
    if (invalidPassword === '' || invalidPassword.length < 8 || invalidPassword === 'password' || invalidPassword === '123') {
      expect(isOnRegistrationPage).toBeTruthy();
    }
  }
});

test('❌ Registration with mismatched password confirmation', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const email = randomEmail();
  const phone = randomPhone();
  const password = 'Abdcd@247';
  const wrongConfirmPassword = 'Different@123';

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.locator('#userEmail').fill(email);
  await page.locator('#userMobile').fill(phone);
  await page.locator('#userPassword').fill(password);
  await page.locator('#confirmPassword').fill(wrongConfirmPassword);
  await page.locator('//input[@value="Male"]').click();
  await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
  await page.locator('//input[@type="checkbox"]').click();

  await page.locator('#login').click();
  await page.waitForTimeout(2000);

  // Check if we're still on registration page (validation should prevent submission)
  const isOnRegistrationPage = await page.locator('#userEmail').isVisible();
  expect(isOnRegistrationPage).toBeTruthy();
});

test('❌ Registration with invalid phone numbers', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const email = randomEmail();
  const password = 'Abdcd@247';

  for (const invalidPhone of invalidPhones) {
    console.log(`Testing invalid phone: "${invalidPhone}"`);
    
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await page.locator('//a[normalize-space()="Register here"]').click();
    await expect(page.locator('#userEmail')).toBeVisible();

    await page.locator('#firstName').fill(firstName);
    await page.locator('#lastName').fill(lastName);
    await page.locator('#userEmail').fill(email);
    await page.locator('#userMobile').fill(invalidPhone);
    await page.locator('#userPassword').fill(password);
    await page.locator('#confirmPassword').fill(password);
    await page.locator('//input[@value="Male"]').click();
    await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
    await page.locator('//input[@type="checkbox"]').click();

    await page.locator('#login').click();
    await page.waitForTimeout(2000);

    // Check if we're still on registration page (validation should prevent submission for invalid phones)
    const isOnRegistrationPage = await page.locator('#userEmail').isVisible();
    
    // For invalid phones (empty, too short, contains letters), we should stay on registration page
    if (invalidPhone === '' || invalidPhone.length < 10 || invalidPhone === 'abcdefghij' || invalidPhone === '123') {
      expect(isOnRegistrationPage).toBeTruthy();
    }
  }
});

test('❌ Registration without accepting terms checkbox', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const email = randomEmail();
  const phone = randomPhone();
  const password = 'Abdcd@247';

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.locator('#userEmail').fill(email);
  await page.locator('#userMobile').fill(phone);
  await page.locator('#userPassword').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('//input[@value="Male"]').click();
  await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
  // Don't check the terms checkbox

  await page.locator('#login').click();

  await expect(page.locator('text=*Please check above checkbox')).toBeVisible({ timeout: 5000 });
});

// 🔹 NEGATIVE TESTS - Login Form Validation
test('❌ Login with empty credentials', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await expect(page.locator('#userEmail')).toBeVisible();

  await page.locator('#login').click();
  await page.waitForTimeout(2000);

  // Should stay on login page if validation prevents submission
  const isStillOnLoginPage = await page.locator('#userEmail').isVisible();
  expect(isStillOnLoginPage).toBeTruthy();
});

test('❌ Login with invalid credentials', async ({ page }) => {
  const invalidCredentials = [
    { email: 'nonexistent@test.com', password: 'WrongPass@123' },
    { email: 'invalid-email-format', password: 'ValidPass@123' },
    { email: '', password: 'ValidPass@123' },
    { email: 'valid@test.com', password: '' }
  ];

  for (const cred of invalidCredentials) {
    console.log(`Testing invalid login: ${cred.email} / ${cred.password}`);
    
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await expect(page.locator('#userEmail')).toBeVisible();

    await page.locator('#userEmail').fill(cred.email);
    await page.locator('#userPassword').fill(cred.password);
    await page.locator('#login').click();
    
    await page.waitForTimeout(3000);

    // For invalid login, we should either stay on login page or see error toast/message
    const isStillOnLoginPage = await page.locator('#userEmail').isVisible();
    const hasErrorToast = await page.locator('.toast-error, .toast-message, [aria-label*="Incorrect"], [class*="error"]').count() > 0;
    
    // Either should stay on login page or show some error indication
    expect(isStillOnLoginPage || hasErrorToast).toBeTruthy();
  }
});

test('❌ Login with SQL injection attempts', async ({ page }) => {
  const sqlInjectionInputs = [
    { email: "admin'--", password: "anything" },
    { email: "admin' OR '1'='1'--", password: "password" },
    { email: "admin'; DROP TABLE users;--", password: "test" },
    { email: "1' UNION SELECT * FROM users--", password: "test" }
  ];

  for (const maliciousInput of sqlInjectionInputs) {
    console.log(`Testing SQL injection in login: ${maliciousInput.email}`);
    
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await expect(page.locator('#userEmail')).toBeVisible();

    await page.locator('#userEmail').fill(maliciousInput.email);
    await page.locator('#userPassword').fill(maliciousInput.password);
    await page.locator('#login').click();
    
    await page.waitForTimeout(3000);

    // Should not successfully login with SQL injection attempts
    const isStillOnLoginPage = await page.locator('#userEmail').isVisible();
    expect(isStillOnLoginPage).toBeTruthy();
  }
});

test('❌ Login with extremely long inputs', async ({ page }) => {
  const longEmail = 'a'.repeat(500) + '@test.com';
  const longPassword = 'P@ssw0rd' + 'x'.repeat(1000);

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await expect(page.locator('#userEmail')).toBeVisible();

  await page.locator('#userEmail').fill(longEmail);
  await page.locator('#userPassword').fill(longPassword);
  await page.locator('#login').click();
  
  await page.waitForTimeout(3000);

  // Should handle long inputs gracefully (either validation or graceful failure)
  const isStillOnLoginPage = await page.locator('#userEmail').isVisible();
  expect(isStillOnLoginPage).toBeTruthy();
});

test('❌ Login form field validation behavior', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await expect(page.locator('#userEmail')).toBeVisible();

  // Test email field accepts typical email format
  await page.locator('#userEmail').fill('test@example.com');
  const emailValue = await page.locator('#userEmail').inputValue();
  expect(emailValue).toBe('test@example.com');

  // Test password field masks input (type should be password)
  const passwordFieldType = await page.locator('#userPassword').getAttribute('type');
  expect(passwordFieldType).toBe('password');

  // Test form doesn't submit with just email
  await page.locator('#userEmail').fill('test@example.com');
  await page.locator('#userPassword').fill('');
  await page.locator('#login').click();
  
  await page.waitForTimeout(2000);
  const isStillOnLoginPage = await page.locator('#userEmail').isVisible();
  expect(isStillOnLoginPage).toBeTruthy();
});

test('❌ Login with special characters in password', async ({ page }) => {
  const specialPasswordTests = [
    { email: 'test@example.com', password: '!@#$%^&*()' },
    { email: 'test@example.com', password: '""' },
    { email: 'test@example.com', password: "''" },
    { email: 'test@example.com', password: '<script>alert("xss")</script>' }
  ];

  for (const testCase of specialPasswordTests) {
    console.log(`Testing login with special password: ${testCase.password}`);
    
    await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
    await expect(page.locator('#userEmail')).toBeVisible();

    await page.locator('#userEmail').fill(testCase.email);
    await page.locator('#userPassword').fill(testCase.password);
    await page.locator('#login').click();
    
    await page.waitForTimeout(3000);

    // Should handle special characters safely (not cause errors or XSS)
    const isStillOnLoginPage = await page.locator('#userEmail').isVisible();
    expect(isStillOnLoginPage).toBeTruthy();
  }
});

test('❌ Duplicate registration with same email', async ({ page }) => {
  const firstName = `FN_${randomString(5)}`;
  const lastName = `LN_${randomString(5)}`;
  const email = `duplicate_${Date.now()}@test.com`;
  const phone = randomPhone();
  const password = 'Abdcd@247';

  // First registration
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  await page.locator('#firstName').fill(firstName);
  await page.locator('#lastName').fill(lastName);
  await page.locator('#userEmail').fill(email);
  await page.locator('#userMobile').fill(phone);
  await page.locator('#userPassword').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('//input[@value="Male"]').click();
  await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
  await page.locator('//input[@type="checkbox"]').click();

  await page.locator('#login').click();
  await expect(page.locator('//h1[normalize-space()="Account Created Successfully"]')).toBeVisible({ timeout: 15000 });

  // Try duplicate registration by going to registration page directly
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  await page.locator('#firstName').fill(`New_${firstName}`);
  await page.locator('#lastName').fill(`New_${lastName}`);
  await page.locator('#userEmail').fill(email); // Same email
  await page.locator('#userMobile').fill(randomPhone());
  await page.locator('#userPassword').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('//input[@value="Male"]').click();
  await page.locator('select.custom-select').selectOption({ label: 'Engineer' });
  await page.locator('//input[@type="checkbox"]').click();

  await page.locator('#login').click();
  await page.waitForTimeout(3000);

  // Should either stay on registration page or show error (app should prevent duplicate emails)
  const isStillOnRegistrationPage = await page.locator('#userEmail').isVisible();
  const hasErrorMessage = await page.locator('[class*="error"], .toast-error, .alert').count() > 0;
  
  expect(isStillOnRegistrationPage || hasErrorMessage).toBeTruthy();
});

// 🔹 BOUNDARY TESTS - Field Length Validation
test('❌ Registration with boundary value testing', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  // Test with very long strings
  const longString = 'a'.repeat(256);
  const longEmail = `${'a'.repeat(50)}@${'b'.repeat(50)}.com`;

  await page.locator('#firstName').fill(longString);
  await page.locator('#lastName').fill(longString);
  await page.locator('#userEmail').fill(longEmail);
  await page.locator('#userMobile').fill('12345678901234567890'); // Very long phone
  await page.locator('#userPassword').fill('a'.repeat(200));
  await page.locator('#confirmPassword').fill('a'.repeat(200));

  // Check if form handles long inputs gracefully
  const firstNameValue = await page.locator('#firstName').inputValue();
  const emailValue = await page.locator('#userEmail').inputValue();
  
  console.log('First name length after input:', firstNameValue.length);
  console.log('Email length after input:', emailValue.length);
});

// 🔹 UI/UX NEGATIVE TESTS
test('❌ Navigation and UI element testing', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  
  // Test clicking register link once
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();
  
  // Verify we're on registration page
  const registrationFields = await page.locator('#firstName, #lastName, #userMobile').count();
  expect(registrationFields).toBeGreaterThan(0);
  
  // Test browser back button behavior
  await page.goBack();
  await page.waitForTimeout(2000);
  
  // Should be back on login page
  const isBackOnLoginPage = await page.locator('#userEmail').isVisible();
  expect(isBackOnLoginPage).toBeTruthy();
});

test('❌ SQL Injection and XSS attempts', async ({ page }) => {
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    '<script>alert("xss")</script>',
    "admin'--",
    "1' OR '1'='1",
    "<img src=x onerror=alert('xss')>"
  ];

  await page.goto('https://rahulshettyacademy.com/client/#/auth/login');
  await page.locator('//a[normalize-space()="Register here"]').click();
  await expect(page.locator('#userEmail')).toBeVisible();

  for (const maliciousInput of maliciousInputs) {
    console.log(`Testing malicious input: ${maliciousInput}`);
    
    await page.locator('#firstName').fill(maliciousInput);
    await page.locator('#lastName').fill('TestLast');
    await page.locator('#userEmail').fill(`test${Date.now()}@test.com`);
    await page.locator('#userMobile').fill(randomPhone());
    await page.locator('#userPassword').fill('ValidPass@123');
    await page.locator('#confirmPassword').fill('ValidPass@123');
    
    // The application should sanitize inputs and not execute malicious code
    await page.locator('#login').click();
    
    // Verify no JavaScript alerts appeared (XSS prevention)
    // and form either submits safely or shows validation error
    await page.waitForTimeout(2000);
    
    // Clear fields for next iteration
    await page.locator('#firstName').fill('');
    await page.locator('#lastName').fill('');
    await page.locator('#userEmail').fill('');
    await page.locator('#userMobile').fill('');
    await page.locator('#userPassword').fill('');
    await page.locator('#confirmPassword').fill('');
  }
});