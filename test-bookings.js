const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Login as Super Admin
  console.log('Logging in as Super Admin...');
  await page.goto('http://localhost:3000/en/admin/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('Logged in');

  // Go to appointments page
  console.log('Navigating to appointments page...');
  await page.goto('http://localhost:3000/en/admin/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'screenshot-bookings-page.png', fullPage: true });
  console.log('Screenshot: screenshot-bookings-page.png');

  // Check page title
  const title = await page.locator('h1').first().textContent();
  console.log(`Page title: ${title}`);

  // Check if stats cards exist
  const statCards = await page.locator('.grid.grid-cols-1 .rounded-lg').count();
  console.log(`Stats cards count: ${statCards}`);

  // Check if table exists
  const tableExists = await page.locator('table').isVisible();
  console.log(`Table visible: ${tableExists}`);

  // Check for loading state or data
  const loadingIndicator = await page.locator('text=Loading').isVisible();
  const noBookingsMessage = await page.locator('text=No bookings found').isVisible();
  const hasRows = await page.locator('table tbody tr').count();

  console.log(`Loading indicator visible: ${loadingIndicator}`);
  console.log(`No bookings message visible: ${noBookingsMessage}`);
  console.log(`Table rows count: ${hasRows}`);

  // Check for action dropdown
  if (hasRows > 0) {
    const actionButton = await page.locator('table tbody tr:first-child button').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshot-bookings-dropdown.png' });
      console.log('Screenshot: screenshot-bookings-dropdown.png');

      // Check dropdown items
      const viewBtn = await page.locator('button:has-text("View Details")').isVisible();
      const statusBtn = await page.locator('button:has-text("Change Status")').isVisible();
      console.log(`View Details button visible: ${viewBtn}`);
      console.log(`Change Status button visible: ${statusBtn}`);
    }
  }

  await browser.close();
  console.log('Done!');
})();
