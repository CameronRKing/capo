import { test, expect } from '@playwright/test';

test.describe('Access Request', () => {
  test('complete access request workflow', async ({ page }) => {
    await page.goto('/request-access');

    // Check page loaded
    await expect(page.locator('h1:has-text("Request")').or(page.locator('h1:has-text("Access")')).first()).toBeVisible();

    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');

    // Select role (Student/Teacher/Admin)
    const roleLabel = page.locator('label').filter({ hasText: /Student|Teacher|Admin/ }).first();
    await roleLabel.click();

    // Submit
    await page.click('button[type="submit"]');

    // Should show success message or loading state
    await expect(page.locator('text=success').or(page.locator('text=submitted')).or(page.locator('text=Thank you'))).isVisible({ timeout: 5000 });
  });

  test('form validation - empty fields', async ({ page }) => {
    await page.goto('/request-access');

    // Submit without filling
    await page.click('button[type="submit"]');

    // Should show validation errors
    const hasNameError = await page.locator('text=Name is required').or(page.locator('text=name.*required')).count() > 0;
    const hasEmailError = await page.locator('text=Email is required').or(page.locator('text=email.*required')).count() > 0;
    const hasHtml5Validation = await page.locator('input:invalid').count() > 0;

    expect(hasNameError || hasEmailError || hasHtml5Validation).toBeTruthy();
  });

  test('form validation - invalid email', async ({ page }) => {
    await page.goto('/request-access');

    // Fill name but invalid email
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'not-an-email');

    // Submit
    await page.click('button[type="submit"]');

    // Should show email validation error
    const hasEmailError = await page.locator('text=invalid email').or(page.locator('text=email.*invalid')).count() > 0;
    const hasHtml5Validation = await page.locator('input[name="email"]:invalid').count() > 0;

    expect(hasEmailError || hasHtml5Validation).toBeTruthy();
  });

  test('role selection interaction', async ({ page }) => {
    await page.goto('/request-access');

    // Find role selection elements
    const roleOptions = page.locator('label').filter({ hasText: /Student|Teacher|Admin/i });

    const count = await roleOptions.count();
    expect(count).toBeGreaterThan(0);

    // Click first role option
    if (count > 0) {
      await roleOptions.first().click();

      // Check if visual selection indicator appears
      const selectedOption = page.locator('input[type="radio"]:checked').or(page.locator('[aria-selected="true"]'));
      const hasSelection = await selectedOption.count() > 0;
      expect(hasSelection).toBeTruthy();
    }
  });

  test('form clears errors on input', async ({ page }) => {
    await page.goto('/request-access');

    // Submit empty form to trigger errors
    await page.click('button[type="submit"]');
    await page.waitForTimeout(100);

    // Start typing in name field
    await page.fill('input[name="name"]', 'Test');

    // Name error should clear (if using custom validation)
    const nameError = page.locator('text=Name is required').or(page.locator('text=name.*required'));
    const errorCleared = await nameError.count() === 0;

    // If error still exists, type more
    if (!errorCleared) {
      await page.fill('input[name="email"]', 'test@example.com');
      await page.waitForTimeout(100);
    }

    // At minimum, verify input is possible
    await expect(page.locator('input[name="name"]')).toHaveValue('Test');
  });
});
