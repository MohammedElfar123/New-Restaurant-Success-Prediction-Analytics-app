const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  try {
    // Login first
    console.log('Logging in...');
    await page.goto('http://localhost:3000/ar/admin/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', 'admin@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin/users', { timeout: 15000 });
    console.log('Login successful!');

    // Arabic - Doctor Bookings
    console.log('Taking screenshot of Doctor Bookings (Arabic)...');
    await page.goto('http://localhost:3000/ar/admin/bookings/doctors');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-bookings-doctors-ar.png', fullPage: false });
    console.log('Saved: screenshot-bookings-doctors-ar.png');

    // English - Doctor Bookings
    console.log('Taking screenshot of Doctor Bookings (English)...');
    await page.goto('http://localhost:3000/en/admin/bookings/doctors');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-bookings-doctors-en.png', fullPage: false });
    console.log('Saved: screenshot-bookings-doctors-en.png');

    // Arabic - Hospital Bookings
    console.log('Taking screenshot of Hospital Bookings (Arabic)...');
    await page.goto('http://localhost:3000/ar/admin/bookings/hospitals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-bookings-hospitals-ar.png', fullPage: false });
    console.log('Saved: screenshot-bookings-hospitals-ar.png');

    // Arabic - Clinic Bookings
    console.log('Taking screenshot of Clinic Bookings (Arabic)...');
    await page.goto('http://localhost:3000/ar/admin/bookings/clinics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshot-bookings-clinics-ar.png', fullPage: false });
    console.log('Saved: screenshot-bookings-clinics-ar.png');

    console.log('\nAll screenshots taken successfully!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'screenshot-error.png' });
  } finally {
    await browser.close();
  }
}

takeScreenshots();
