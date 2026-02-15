const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Capture API responses
  let apiResponse = null;
  page.on('response', async (response) => {
    if (response.url().includes('/bookings')) {
      try {
        const json = await response.json();
        apiResponse = json;
        console.log('\n=== API Response ===');
        console.log('URL:', response.url());
        console.log('Status:', json.status);
        console.log('Total Count:', json.data?.count);
        console.log('Current Page:', json.data?.current_page);
        console.log('Last Page:', json.data?.last_page);
        console.log('Per Page:', json.data?.per_page);
        console.log('Items Count:', json.data?.items?.length);

        if (json.data?.items?.length > 0) {
          console.log('\n=== First Booking Sample ===');
          const firstBooking = json.data.items[0];
          console.log(JSON.stringify(firstBooking, null, 2));
        }
      } catch (e) {
        // Not JSON response
      }
    }
  });

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
  console.log('\nNavigating to appointments page...');
  await page.goto('http://localhost:3000/en/admin/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'screenshot-bookings-full.png', fullPage: true });
  console.log('\nScreenshot: screenshot-bookings-full.png');

  // Check table rows
  const tableRows = await page.locator('table tbody tr').count();
  console.log(`\nTable rows displayed: ${tableRows}`);

  // Check pagination info
  const paginationText = await page.locator('.border-t.border-slate-200').textContent();
  console.log(`Pagination text: ${paginationText}`);

  // Check if there are page buttons
  const pageButtons = await page.locator('.flex.items-center.gap-2 button').count();
  console.log(`Page buttons: ${pageButtons}`);

  // Test clicking on page 2 if exists
  const page2Button = page.locator('button:has-text("2")').first();
  if (await page2Button.isVisible()) {
    console.log('\nClicking page 2...');
    await page2Button.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-bookings-page2.png', fullPage: true });
    console.log('Screenshot: screenshot-bookings-page2.png');
  }

  // Go back to page 1 and test dropdown
  console.log('\nGoing back to page 1...');
  await page.goto('http://localhost:3000/en/admin/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Test action dropdown
  console.log('\nTesting action dropdown...');
  const actionButtons = await page.locator('table tbody tr td:last-child button');
  const firstActionBtn = actionButtons.first();

  if (await firstActionBtn.isVisible()) {
    console.log('Action button found, clicking...');
    await firstActionBtn.click();
    await page.waitForTimeout(1000);

    // Take screenshot of dropdown
    await page.screenshot({ path: 'screenshot-dropdown-open.png', fullPage: false });
    console.log('Screenshot: screenshot-dropdown-open.png');

    // Check dropdown content
    const dropdownVisible = await page.locator('.absolute.end-0.mt-1.w-44').isVisible();
    console.log(`Dropdown visible: ${dropdownVisible}`);

    if (dropdownVisible) {
      const dropdownHTML = await page.locator('.absolute.end-0.mt-1.w-44').innerHTML();
      console.log('Dropdown content:', dropdownHTML);
    }
  }

  await browser.close();
  console.log('\nDone!');
})();
