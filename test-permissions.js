const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'log' && msg.text().includes('permission')) {
      console.log('Console:', msg.text());
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

  // Go to sliders page
  console.log('Checking sliders page...');
  await page.goto('http://localhost:3000/en/admin/sliders');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Take screenshot of sidebar and main content
  await page.screenshot({ path: 'permissions-sidebar.png', fullPage: true });
  console.log('Screenshot: permissions-sidebar.png');

  // Check if Add New Slider button exists (Super Admin should see it)
  const addButton = await page.locator('button:has-text("Add New Slider")');
  const addButtonVisible = await addButton.isVisible();
  console.log(`Add New Slider button visible: ${addButtonVisible}`);

  // Click on action menu to verify all options are visible
  const actionButton = await page.locator('table tbody tr:first-child td:last-child button').first();
  if (await actionButton.isVisible()) {
    await actionButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'permissions-dropdown.png', fullPage: false });
    console.log('Screenshot: permissions-dropdown.png');

    // Check dropdown items
    const viewBtn = await page.locator('button:has-text("View")');
    const editBtn = await page.locator('button:has-text("Edit")');
    const deleteBtn = await page.locator('button:has-text("Delete")');

    console.log(`View button visible: ${await viewBtn.isVisible()}`);
    console.log(`Edit button visible: ${await editBtn.isVisible()}`);
    console.log(`Delete button visible: ${await deleteBtn.isVisible()}`);
  }

  // Check sidebar items count
  const sidebarLinks = await page.locator('nav a').count();
  console.log(`Sidebar links count: ${sidebarLinks}`);

  await browser.close();
  console.log('Done!');
})();
