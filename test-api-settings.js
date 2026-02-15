const { chromium } = require("playwright");

async function testSettingsAPI() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  // Capture console logs
  page.on("console", (msg) => {
    if (msg.text().includes("[API")) {
      console.log("BROWSER LOG:", msg.text());
    }
  });

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

    // Get token from localStorage
    const token = await page.evaluate(() => localStorage.getItem("access_token"));
    console.log("\nToken found:", token ? "Yes (length: " + token.length + ")" : "No");

    // Navigate to settings and check network requests
    console.log("\nNavigating to General Settings...");

    // Listen for API responses
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("get-settings") || url.includes("faqs") || url.includes("info/")) {
        console.log(`\n=== API Response: ${url} ===`);
        console.log("Status:", response.status());
        try {
          const body = await response.json();
          console.log("Response:", JSON.stringify(body, null, 2).substring(0, 500));
        } catch (e) {
          console.log("Response: (not JSON)");
        }
      }
    });

    await page.goto("http://localhost:3000/ar/admin/settings/general");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000);

    console.log("\n--- Testing FAQs endpoint ---");
    await page.goto("http://localhost:3000/ar/admin/settings/faqs");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000);

    console.log("\n--- Testing Info Pages endpoint ---");
    await page.goto("http://localhost:3000/ar/admin/settings/info-pages");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
}

testSettingsAPI();
