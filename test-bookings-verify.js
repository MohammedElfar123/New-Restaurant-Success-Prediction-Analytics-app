const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Capture full API response
  page.on('response', async (response) => {
    if (response.url().includes('/bookings')) {
      try {
        const json = await response.json();
        console.log('\n=== Full API Response Structure ===');
        console.log(JSON.stringify(json, null, 2).substring(0, 2000));
      } catch (e) {
        // Not JSON
      }
    }
  });

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/en/admin/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Navigate to appointments
  console.log('Going to appointments...');
  await page.goto('http://localhost:3000/en/admin/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Screenshot
  await page.screenshot({ path: 'screenshot-verify.png', fullPage: true });
  console.log('\nScreenshot saved: screenshot-verify.png');

  // Test action dropdown
  console.log('\n=== Testing Action Dropdown ===');
  const actionButton = page.locator('table tbody tr:first-child td:last-child button').first();

  if (await actionButton.isVisible()) {
    console.log('Action button found');
    await actionButton.click();
    await page.waitForTimeout(500);

    // Take screenshot of dropdown
    await page.screenshot({ path: 'screenshot-dropdown.png' });
    console.log('Dropdown screenshot saved: screenshot-dropdown.png');

    // Check if dropdown is visible
    const dropdown = page.locator('.absolute.end-0.mt-1.w-44');
    if (await dropdown.isVisible()) {
      console.log('Dropdown is visible!');
      const html = await dropdown.innerHTML();
      console.log('Dropdown content:', html);
    } else {
      console.log('Dropdown NOT visible - checking alternative selector');
      // Try alternative selector
      const anyDropdown = page.locator('[class*="absolute"][class*="bg-white"][class*="shadow"]');
      const count = await anyDropdown.count();
      console.log(`Found ${count} potential dropdowns`);
    }
  } else {
    console.log('Action button NOT found');
  }

  await browser.close();
  console.log('\nDone!');
})();
