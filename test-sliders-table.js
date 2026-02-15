const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Login first
  console.log('Logging in...');
  await page.goto('http://localhost:3000/ar/admin/login');
  await page.waitForLoadState('networkidle');

  // Correct credentials from the hint
  await page.fill('input[type="email"]', 'admin@gmail.com');
  await page.fill('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForTimeout(5000);
  console.log('Current URL:', page.url());

  // Go to sliders page (Arabic)
  console.log('Navigating to sliders page (Arabic)...');
  await page.goto('http://localhost:3000/ar/admin/sliders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot of Arabic version
  await page.screenshot({ path: 'screenshot-sliders-ar.png', fullPage: true });
  console.log('Screenshot saved: screenshot-sliders-ar.png');

  // Go to sliders page (English)
  console.log('Navigating to sliders page (English)...');
  await page.goto('http://localhost:3000/en/admin/sliders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot of English version
  await page.screenshot({ path: 'screenshot-sliders-en.png', fullPage: true });
  console.log('Screenshot saved: screenshot-sliders-en.png');

  await browser.close();
  console.log('Done!');
})();
