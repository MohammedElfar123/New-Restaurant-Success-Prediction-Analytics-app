const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

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

  // Screenshot of tabs
  await page.screenshot({ path: 'screenshot-tabs.png', fullPage: true });
  console.log('Tabs screenshot saved');

  // Click on Pending tab
  console.log('Clicking Pending tab...');
  await page.locator('button:has-text("Pending")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshot-pending-tab.png' });
  console.log('Pending tab screenshot saved');

  // Click back to All
  await page.locator('button:has-text("All")').first().click();
  await page.waitForTimeout(1500);

  // Click on first row's action button and view details
  console.log('Testing View Details...');
  const actionButton = page.locator('table tbody tr:first-child td:last-child button').first();
  if (await actionButton.isVisible()) {
    await actionButton.click();
    await page.waitForTimeout(500);

    // Click View Details
    const viewBtn = page.locator('button:has-text("View Details")');
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Screenshot of details page
      await page.screenshot({ path: 'screenshot-booking-details.png', fullPage: true });
      console.log('Booking details screenshot saved');
    }
  }

  await browser.close();
  console.log('\nDone!');
})();
