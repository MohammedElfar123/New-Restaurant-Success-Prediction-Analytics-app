const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/ar/admin/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('Logged in');

  // Test Sliders Page - English
  console.log('Testing Sliders (English)...');
  await page.goto('http://localhost:3000/en/admin/sliders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Click first dropdown
  const slidersDropdownEN = await page.locator('table tbody tr:first-child td:last-child button').first();
  if (await slidersDropdownEN.isVisible()) {
    await slidersDropdownEN.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'dropdown-sliders-en.png', fullPage: false });
  console.log('Screenshot: dropdown-sliders-en.png');

  // Test Sliders Page - Arabic
  console.log('Testing Sliders (Arabic)...');
  await page.goto('http://localhost:3000/ar/admin/sliders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const slidersDropdownAR = await page.locator('table tbody tr:first-child td:last-child button').first();
  if (await slidersDropdownAR.isVisible()) {
    await slidersDropdownAR.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'dropdown-sliders-ar.png', fullPage: false });
  console.log('Screenshot: dropdown-sliders-ar.png');

  // Test Users Page - English
  console.log('Testing Users (English)...');
  await page.goto('http://localhost:3000/en/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const usersDropdownEN = await page.locator('table tbody tr:first-child td:last-child button').first();
  if (await usersDropdownEN.isVisible()) {
    await usersDropdownEN.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'dropdown-users-en.png', fullPage: false });
  console.log('Screenshot: dropdown-users-en.png');

  // Test Users Page - Arabic
  console.log('Testing Users (Arabic)...');
  await page.goto('http://localhost:3000/ar/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const usersDropdownAR = await page.locator('table tbody tr:first-child td:last-child button').first();
  if (await usersDropdownAR.isVisible()) {
    await usersDropdownAR.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'dropdown-users-ar.png', fullPage: false });
  console.log('Screenshot: dropdown-users-ar.png');

  await browser.close();
  console.log('Done!');
})();
