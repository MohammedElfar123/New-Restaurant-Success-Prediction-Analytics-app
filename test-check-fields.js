const { chromium } = require('playwright');

async function checkBookingFields() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
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

    // Intercept API calls
    let bookingsData = null;
    page.on('response', async (response) => {
      if (response.url().includes('/bookings') && response.status() === 200) {
        try {
          const data = await response.json();
          bookingsData = data;
        } catch (e) {}
      }
    });

    // Go to bookings page
    await page.goto('http://localhost:3000/ar/admin/bookings/doctors');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    if (bookingsData) {
      console.log('\n=== API RESPONSE STRUCTURE ===\n');

      const items = bookingsData.data?.items || bookingsData.data?.data || bookingsData.data || [];

      if (items.length > 0) {
        const booking = items[0];
        console.log('First booking fields:');
        console.log(JSON.stringify(booking, null, 2));

        console.log('\n=== DATE-RELATED FIELDS ===');
        const dateFields = Object.keys(booking).filter(k =>
          k.includes('date') || k.includes('time') || k.includes('_at') || k.includes('created')
        );
        console.log('Fields:', dateFields);

        dateFields.forEach(field => {
          console.log(`  ${field}: ${booking[field]}`);
        });

        console.log('\n=== FIRST 5 BOOKINGS SORTED BY ID ===');
        const sorted = items.slice().sort((a, b) => b.id - a.id);
        sorted.slice(0, 5).forEach((b, i) => {
          console.log(`[${i+1}] ID: ${b.id}, created_at: ${b.created_at}, data_at: ${b.data_at}`);
        });
      }
    } else {
      console.log('Could not capture bookings data');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkBookingFields();
