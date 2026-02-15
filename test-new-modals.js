const { chromium } = require('@playwright/test');

(async () => {
  console.log('Starting professional modals test...');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // First login
    console.log('Logging in...');
    await page.goto('http://localhost:3001/ar/admin/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (emailInput && passwordInput && submitButton) {
      await emailInput.fill('admin@gmail.com');
      await passwordInput.fill('12345678');
      await submitButton.click();
      await page.waitForTimeout(3000);
    }

    // Navigate to users page
    console.log('Navigating to users page...');
    await page.goto('http://localhost:3001/ar/admin/users', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Screenshot of the page
    await page.screenshot({ path: 'screenshot-users-page.png', fullPage: false });
    console.log('Users page screenshot saved');

    // Test 1: View User Details Modal
    console.log('\n=== Test 1: View User Details Modal ===');
    const userRow = await page.$('table tbody tr button');
    if (userRow) {
      await userRow.click();
      await page.waitForTimeout(2000);

      const viewModal = await page.$('[role="dialog"]');
      if (viewModal) {
        console.log('SUCCESS: View User Details modal opened!');
        await page.screenshot({ path: 'screenshot-view-modal.png' });
        console.log('View modal screenshot saved');

        // Close modal
        const closeBtn = await page.$('[role="dialog"] button:has-text("إغلاق")');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    await page.waitForTimeout(1000);

    // Test 2: Add User Modal
    console.log('\n=== Test 2: Add User Modal ===');
    const addButton = await page.$('button:has-text("إضافة مستخدم")');
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(1000);

      const addModal = await page.$('[role="dialog"]');
      if (addModal) {
        console.log('SUCCESS: Add User modal opened!');
        await page.screenshot({ path: 'screenshot-add-modal.png' });
        console.log('Add modal screenshot saved');

        // Close modal
        const closeBtn = await page.$('[role="dialog"] button:has-text("إلغاء")');
        if (closeBtn) {
          await closeBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    await page.waitForTimeout(1000);

    // Test 3: Delete Confirmation Modal
    console.log('\n=== Test 3: Delete Confirmation Modal ===');
    const actionBtn = await page.$('table tbody tr button.h-8.w-8');
    if (actionBtn) {
      await actionBtn.click();
      await page.waitForTimeout(500);

      const deleteBtn = await page.$('button:has-text("حذف المستخدم")');
      if (deleteBtn) {
        await deleteBtn.click();
        await page.waitForTimeout(1000);

        const deleteModal = await page.$('[role="dialog"]');
        if (deleteModal) {
          console.log('SUCCESS: Delete Confirmation modal opened!');
          await page.screenshot({ path: 'screenshot-delete-modal.png' });
          console.log('Delete modal screenshot saved');
        }
      }
    }

    console.log('\n=== All tests completed! ===');

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
})();
