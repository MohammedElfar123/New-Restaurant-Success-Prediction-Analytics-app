const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Capture console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  // Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/en/admin/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);

  // Go to sliders page
  console.log('Navigating to sliders...');
  await page.goto('http://localhost:3000/en/admin/sliders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'sliders-check.png', fullPage: true });
  console.log('Screenshot saved: sliders-check.png');

  // Test Add Slider modal
  console.log('Testing Add Slider modal...');
  const addButton = page.locator('button:has-text("Add New Slider")');
  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'sliders-add-modal.png', fullPage: true });
    console.log('Screenshot saved: sliders-add-modal.png');
  }

  // Print any errors
  if (errors.length > 0) {
    console.log('\n=== Console Errors ===');
    errors.forEach(e => console.log(e));
  } else {
    console.log('\nNo console errors found!');
  }

  await browser.close();
  console.log('Done!');
})();
