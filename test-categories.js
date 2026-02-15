const { chromium } = require("playwright");

async function testCategories() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Login as admin - use credentials shown on login page
    console.log("Logging in...");
    await page.goto("http://localhost:3000/ar/login/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Fill login form with demo credentials from login page
    await page.fill('input[type="email"]', "admin@gmail.com");
    await page.fill('input[type="password"]', "12345678");

    // Click submit
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForTimeout(5000);

    // Check current URL
    const currentUrl = page.url();
    console.log("Current URL after login:", currentUrl);

    if (currentUrl.includes("dashboard")) {
      console.log("Login successful!");
    }

    // Navigate to Categories page
    console.log("Navigating to Categories page...");
    await page.goto("http://localhost:3000/ar/admin/settings/categories");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Take screenshot of Categories list
    await page.screenshot({
      path: "screenshot-categories-list.png",
      fullPage: false,
    });
    console.log("Categories list screenshot saved!");

    // Navigate to Add Category page
    console.log("Navigating to Add Category page...");
    await page.goto("http://localhost:3000/ar/admin/settings/categories/add");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Take screenshot of Add Category
    await page.screenshot({
      path: "screenshot-categories-add.png",
      fullPage: false,
    });
    console.log("Add Category screenshot saved!");

    // Navigate to edit first category (id=1)
    console.log("Navigating to Edit Category page...");
    await page.goto("http://localhost:3000/ar/admin/settings/categories/edit/1");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Take screenshot of Edit Category
    await page.screenshot({
      path: "screenshot-categories-edit.png",
      fullPage: false,
    });
    console.log("Edit Category screenshot saved!");

    console.log("\nAll screenshots completed successfully!");
  } catch (error) {
    console.error("Error:", error.message);
    await page.screenshot({ path: "screenshot-error.png" });
  } finally {
    await browser.close();
  }
}

testCategories();
