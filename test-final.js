const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 1200 }
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

  // Full page screenshot
  await page.screenshot({ path: 'screenshot-final.png', fullPage: true });
  console.log('Full page screenshot saved');

  // Check pagination buttons
  console.log('\n=== Checking Pagination ===');
  const paginationExists = await page.locator('.border-t.border-slate-200').isVisible();
  console.log('Pagination section visible:', paginationExists);

  const pageButtons = await page.locator('button:has-text("1")').count();
  console.log('Page 1 button found:', pageButtons > 0);

  const page2Btn = await page.locator('button:has-text("2")').first();
  if (await page2Btn.isVisible()) {
    console.log('Page 2 button visible - clicking...');
    await page2Btn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-page2.png', fullPage: true });
    console.log('Page 2 screenshot saved');
  }

  // Check stats
  console.log('\n=== Stats Check ===');
  const totalCard = await page.locator('text=Total Bookings').locator('..').locator('..').locator('..').textContent();
  console.log('Total bookings card:', totalCard);

  await browser.close();
  console.log('\nDone!');
})();
