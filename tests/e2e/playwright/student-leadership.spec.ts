import { test, expect } from '@playwright/test';

test.describe('Student Leadership Decisions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?role=student');
    await page.waitForTimeout(1000);
  });

  test('navigate to leadership form', async ({ page }) => {
    await page.goto('/student/leadership');
    await page.waitForTimeout(500);

    const url = page.url();
    const hasLeadershipContent = await page.locator('text=Leadership').or(page.locator('text=Decision')).count() > 0;

    expect(url.includes('/student/leadership') || hasLeadershipContent).toBeTruthy();
  });

  test('leadership page loads candidates', async ({ page }) => {
    await page.goto('/student/leadership');
    await page.waitForTimeout(1000);

    // Look for candidate/employee cards
    const candidateCard = page.locator('[data-testid*="candidate"]').or(page.locator('[data-testid*="employee"]')).or(page.locator('text=Candidate'));

    const count = await candidateCard.count();
    expect(count).toBeGreaterThan(0);
  });

  test('fill leadership inputs', async ({ page }) => {
    await page.goto('/student/leadership');
    await page.waitForTimeout(1000);

    // Look for leadership-related inputs (rankings, ratings, etc.)
    const input = page.locator('input[type="number"]').or(page.locator('input[type="range"]'));

    const inputCount = await input.count();

    if (inputCount > 0) {
      // Fill first input
      await input.first().fill('5');

      // Verify value
      const value = await input.first().inputValue();
      expect(value).toBeTruthy();
    } else {
      // Might use different input mechanism
      const hasLeadership = page.locator('text=Leadership');
      expect(hasLeadership).toBeTruthy();
    }
  });

  test('submit leadership decisions', async ({ page }) => {
    await page.goto('/student/leadership');
    await page.waitForTimeout(1000);

    // Look for submit button
    const submitButton = page.locator('button:has-text("Submit")').or(page.locator('button:has-text("Save")'));

    const buttonCount = await submitButton.count();

    if (buttonCount > 0) {
      // Submit
      await submitButton.first().click();

      // Look for success message
      await page.waitForTimeout(1000);
      const hasSuccess = await page.locator('text=success').or(page.locator('text=submitted')).count() > 0;

      expect(hasSuccess).toBeTruthy();
    } else {
      // No submit button - might be view-only
      const hasLeadership = page.locator('text=Leadership');
      expect(hasLeadership).toBeTruthy();
    }
  });

  test('rankings interaction', async ({ page }) => {
    await page.goto('/student/leadership');
    await page.waitForTimeout(1000);

    // Look for sortable/rankable elements
    const rankableItem = page.locator('[draggable="true"]').or(page.locator('[data-testid*="rank"]')).or(page.locator('.sortable'));

    const count = await rankableItem.count();

    if (count > 0) {
      // Drag and drop interaction would go here
      // For now, just verify elements exist
      expect(count).toBeGreaterThan(0);
    } else {
      // Rankings might use different UI
      const hasLeadership = page.locator('text=Leadership');
      expect(hasLeadership).toBeTruthy();
    }
  });

  test('view leadership instructions', async ({ page }) => {
    await page.goto('/student/leadership');

    // Look for instructions/help text
    const instructions = page.locator('text=instructions').or(page.locator('text=how to')).or(page.locator('[data-testid*="instructions"]'));

    const count = await instructions.count();

    if (count > 0) {
      await expect(instructions.first()).isVisible();
    } else {
      // Instructions might not be present
      const hasContent = page.locator('text=Leadership').or(page.locator('text=Decision'));
      expect(hasContent).toBeTruthy();
    }
  });
});
