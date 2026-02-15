const { chromium } = require("playwright");

async function testBookingPages() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Login first with correct credentials
    console.log("Logging in...");
    await page.goto("http://localhost:3000/en/admin/login");
    await page.waitForLoadState("networkidle");

    // Use the correct credentials from the login hint
    await page.fill('input[type="email"]', "admin@gmail.com");
    await page.fill('input[type="password"]', "12345678");
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(5000);
    console.log("Current URL:", page.url());

    // Test Doctor Bookings Page
    console.log("\n--- Testing Doctor Bookings Page ---");
    await page.goto("http://localhost:3000/en/admin/bookings/doctors");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: "screenshot-doctor-bookings.png",
      fullPage: false
    });
    console.log("Screenshot saved: screenshot-doctor-bookings.png");

    // Test Clinic Bookings Page
    console.log("\n--- Testing Clinic Bookings Page ---");
    await page.goto("http://localhost:3000/en/admin/bookings/clinics");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: "screenshot-clinic-bookings.png",
      fullPage: false
    });
    console.log("Screenshot saved: screenshot-clinic-bookings.png");

    // Test Hospital Bookings Page
    console.log("\n--- Testing Hospital Bookings Page ---");
    await page.goto("http://localhost:3000/en/admin/bookings/hospitals");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: "screenshot-hospital-bookings.png",
      fullPage: false
    });
    console.log("Screenshot saved: screenshot-hospital-bookings.png");

    console.log("\n=== All screenshots taken successfully! ===");

  } catch (error) {
    console.error("Error:", error.message);
    await page.screenshot({ path: "screenshot-error.png" });
  } finally {
    await browser.close();
  }
}

testBookingPages();
