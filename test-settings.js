const { chromium } = require("playwright");

async function testSettings() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Login as admin
    console.log("Logging in...");
    await page.goto("http://localhost:3000/ar/login/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', "admin@gmail.com");
    await page.fill('input[type="password"]', "12345678");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);

    console.log("Current URL after login:", page.url());

    // Screenshot General Settings
    console.log("Navigating to General Settings...");
    await page.goto("http://localhost:3000/ar/admin/settings/general");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "screenshot-settings-general.png",
      fullPage: false,
    });
    console.log("General Settings screenshot saved!");

    // Screenshot FAQs List
    console.log("Navigating to FAQs...");
    await page.goto("http://localhost:3000/ar/admin/settings/faqs");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "screenshot-settings-faqs.png",
      fullPage: false,
    });
    console.log("FAQs screenshot saved!");

    // Screenshot Info Pages
    console.log("Navigating to Info Pages...");
    await page.goto("http://localhost:3000/ar/admin/settings/info-pages");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: "screenshot-settings-info-pages.png",
      fullPage: false,
    });
    console.log("Info Pages screenshot saved!");

    console.log("\nAll screenshots completed successfully!");
  } catch (error) {
    console.error("Error:", error.message);
    await page.screenshot({ path: "screenshot-error.png" });
  } finally {
    await browser.close();
  }
}

testSettings();
