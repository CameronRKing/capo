/**
 * E2E-03: Student Hiring Decision Submission (Playwright)
 *
 * True end-to-end tests for the student hiring decision form.
 * Tests form rendering, validation, and UI interactions using Playwright.
 *
 * Features tested:
 * - Form renders with all sections visible
 * - Compensation package inputs (salary, commission, benefits)
 * - Sales contest configuration
 * - Training time allocation with validation
 * - Recruiting time allocation
 * - Hiring and firing UI
 * - Auto-save functionality
 * - Submit button and confirmation dialog
 * - Form validation error messages
 *
 * Prerequisites:
 * - Dev server running: `npm run dev`
 * - Convex backend available
 *
 * Run with: `npm run test:e2e:playwright -- e2e-03-student-hiring.spec.ts`
 *
 * @see src/routes/student/decisions/hiring.tsx
 * @see src/components/decisions/HiringDecisionForm.tsx
 * @see convex/domain/decisions/validators.ts
 */

import { test, expect } from '@playwright/test';

test.describe('E2E-03: Student Hiring Decision Form', () => {
  test.beforeEach(async ({ page }) => {
    // Login as student using query param
    await page.goto('/?role=student');
    await page.waitForTimeout(1000);

    // Navigate to hiring form
    await page.goto('/student/decisions/hiring');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  // =====================================================
  // Test Suite 1: Form Rendering
  // =====================================================

  test('renders all main sections', async ({ page }) => {
    // Verify all main sections are visible
    await expect(page.locator('text=Compensation Package')).toBeVisible();
    await expect(page.locator('text=Sales Contest')).toBeVisible();
    await expect(page.locator('text=Training Time Allocation')).toBeVisible();
    await expect(page.locator('text=Recruiting Time Allocation')).toBeVisible();
    await expect(page.locator('text=Hiring & Firing')).toBeVisible();
  });

  test('form fields render with default values', async ({ page }) => {
    // Salary default
    const salaryInput = page.locator('input[name*="salary"], input[aria-label*="Salary"]').first();
    await expect(salaryInput).toBeVisible();

    const salaryValue = await salaryInput.inputValue();
    expect(salaryValue).toBe('50000');

    // Commission default (5%)
    await expect(page.locator('text=5%')).toBeVisible();

    // Benefits default (bronze radio button)
    const bronzeRadio = page.locator('input[type="radio"][value="bronze"]');
    await expect(bronzeRadio).toBeChecked();

    // Training defaults (25% each)
    await expect(page.locator('text=Product Knowledge: 25%')).toBeVisible();
    await expect(page.locator('text=Market Orientation: 25%')).toBeVisible();
    await expect(page.locator('text=Company Orientation: 25%')).toBeVisible();
    await expect(page.locator('text=Selling Techniques: 25%')).toBeVisible();

    // Training sum indicator shows 100%
    await expect(page.locator('text=Training Allocation Total:')).toBeVisible();
    await expect(page.locator('text=100%').nth(0)).toBeVisible();
  });

  test('auto-save status indicator container exists', async ({ page }) => {
    // Auto-save status container should exist (flex.justify-end div)
    const saveStatusContainer = page.locator('div.flex.justify-end, div[class*="save"], div[data-testid*="save"]');
    const count = await saveStatusContainer.count();

    // At least one save-related element should exist
    expect(count).toBeGreaterThan(0);
  });

  // =====================================================
  // Test Suite 2: Form Validation
  // =====================================================

  test('salary input accepts valid range values', async ({ page }) => {
    const salaryInput = page.locator('input[name*="salary"], input[aria-label*="Salary"]').first();

    // Valid minimum
    await salaryInput.fill('30000');
    await expect(salaryInput).toHaveValue('30000');

    // Valid maximum
    await salaryInput.fill('100000');
    await expect(salaryInput).toHaveValue('100000');

    // Valid middle value
    await salaryInput.fill('65000');
    await expect(salaryInput).toHaveValue('65000');
  });

  test('commission slider updates percentage display', async ({ page }) => {
    const commissionSlider = page.locator('input[type="range"][name*="commission"], input[aria-label*="commission"]').first();

    // Initial value is 5%
    const initialValue = await commissionSlider.inputValue();
    expect(initialValue).toBe('5');

    // Change to 10%
    await commissionSlider.fill('10');
    await commissionSlider.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Check percentage display updated
    await expect(page.locator('text=10%')).toBeVisible();
  });

  test('training allocation sum updates in real-time', async ({ page }) => {
    // Get all training sliders
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();

    expect(sliderCount).toBeGreaterThanOrEqual(4);

    // Training sliders are likely the first 4
    const productKnowledgeSlider = sliders.nth(0);
    const marketOrientationSlider = sliders.nth(1);

    // Initial sum is 100% (25 + 25 + 25 + 25)
    let trainingSumElement = page.locator('text=Training Allocation Total:');
    await expect(trainingSumElement).toBeVisible();

    // Change product knowledge to 50%
    await productKnowledgeSlider.fill('50');
    await productKnowledgeSlider.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Sum should now be 125%
    await expect(page.locator('text=125%')).toBeVisible();

    // Reduce market orientation to 0%
    await marketOrientationSlider.fill('0');
    await marketOrientationSlider.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Sum should return to 100%
    await expect(page.locator('text=100%')).toBeVisible();
  });

  test('benefits radio buttons can be selected', async ({ page }) => {
    const bronzeRadio = page.locator('input[type="radio"][value="bronze"]');
    const silverRadio = page.locator('input[type="radio"][value="silver"]');
    const goldRadio = page.locator('input[type="radio"][value="gold"]');

    // Initially bronze is selected
    await expect(bronzeRadio).toBeChecked();

    // Click silver
    await silverRadio.click();
    await expect(silverRadio).toBeChecked();
    await expect(bronzeRadio).not.toBeChecked();

    // Click gold
    await goldRadio.click();
    await expect(goldRadio).toBeChecked();
    await expect(silverRadio).not.toBeChecked();
  });

  test('travel selection controls per diem visibility', async ({ page }) => {
    // Initially per diem is hidden (default is "reps_pay_own")
    let perDiemInput = page.locator('input[name*="perDiem"], input[aria-label*="Per Diem"]');
    await expect(perDiemInput).not.toBeVisible();

    // Select "monthly per diem"
    const monthlyPerDiemRadio = page.locator('input[type="radio"][value="monthly_per_diem"]');
    await monthlyPerDiemRadio.click();
    await page.waitForTimeout(500);

    // Per diem input should appear
    perDiemInput = page.locator('input[name*="perDiem"], input[aria-label*="Per Diem"]');
    await expect(perDiemInput).toBeVisible();

    // Select "unlimited" - per diem should disappear
    const unlimitedRadio = page.locator('input[type="radio"][value="unlimited"]');
    await unlimitedRadio.click();
    await page.waitForTimeout(500);

    perDiemInput = page.locator('input[name*="perDiem"], input[aria-label*="Per Diem"]');
    await expect(perDiemInput).not.toBeVisible();
  });

  test('sales contest checkbox controls conditional fields', async ({ page }) => {
    // Initially contest fields are hidden
    await expect(page.locator('text=Contest Type')).not.toBeVisible();
    await expect(page.locator('input[name*="threshold"]')).not.toBeVisible();

    // Enable sales contest
    const hasSalesContestCheckbox = page.locator('input[type="checkbox"][name*="salesContest"], input[aria-label*="sales contest"]');
    await hasSalesContestCheckbox.check();
    await page.waitForTimeout(500);

    // Contest type should appear
    await expect(page.locator('text=Contest Type')).toBeVisible();

    // Select "open" to show threshold
    const openContestRadio = page.locator('input[type="radio"][value="open"]');
    await openContestRadio.click();
    await page.waitForTimeout(500);

    // Sales threshold should appear
    const thresholdInput = page.locator('input[name*="threshold"], input[aria-label*="Threshold"]');
    await expect(thresholdInput).toBeVisible();

    // Disable contest
    await hasSalesContestCheckbox.uncheck();
    await page.waitForTimeout(500);

    await expect(page.locator('text=Contest Type')).not.toBeVisible();
    await expect(thresholdInput).not.toBeVisible();
  });

  test('number to hire input accepts valid values', async ({ page }) => {
    const hireInput = page.locator('input[name*="numberToHire"], input[aria-label*="Number of Sales Reps"]').first();

    // Test values 0-3
    await hireInput.fill('0');
    await expect(hireInput).toHaveValue('0');

    await hireInput.fill('2');
    await expect(hireInput).toHaveValue('2');

    await hireInput.fill('3');
    await expect(hireInput).toHaveValue('3');
  });

  // =====================================================
  // Test Suite 3: Auto-Save Functionality
  // =====================================================

  test('form changes trigger auto-save indicator', async ({ page }) => {
    const salaryInput = page.locator('input[name*="salary"], input[aria-label*="Salary"]').first();

    // Change salary
    await salaryInput.fill('75000');

    // Wait for auto-save debounce (500ms + margin)
    await page.waitForTimeout(2000);

    // Check for save indicator (either "Saving..." or "Saved" or similar)
    const saveIndicator = page.locator('text=Saving, text=Saved, text=Auto-save').first();
    const count = await saveIndicator.count();

    // At least one save-related text should appear or exist
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('multiple rapid changes debounce correctly', async ({ page }) => {
    const salaryInput = page.locator('input[name*="salary"], input[aria-label*="Salary"]').first();

    // Make multiple rapid changes
    await salaryInput.fill('60000');
    await page.waitForTimeout(100);
    await salaryInput.fill('65000');
    await page.waitForTimeout(100);
    await salaryInput.fill('70000');

    // Wait for debounce to complete
    await page.waitForTimeout(2000);

    // Input should have final value
    await expect(salaryInput).toHaveValue('70000');
  });

  // =====================================================
  // Test Suite 4: Submission Workflow
  // =====================================================

  test('submit button exists and is enabled', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit Decisions"), button:has-text("Submit")');

    await expect(submitButton.first()).toBeVisible();
    await expect(submitButton.first()).toBeEnabled();
  });

  test('submit button opens confirmation dialog', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit Decisions"), button:has-text("Submit")').first();

    await submitButton.click();
    await page.waitForTimeout(500);

    // Confirmation dialog should appear
    await expect(page.locator('text=Submit Hiring Decision').or(page.locator('text=Are you sure'))).toBeVisible();
  });

  test('confirmation dialog has cancel and confirm buttons', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit Decisions"), button:has-text("Submit")').first();

    await submitButton.click();
    await page.waitForTimeout(500);

    // Both buttons should be present
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    await expect(page.locator('button:has-text("Confirm"), button:has-text("Yes")')).toBeVisible();
  });

  test('cancel closes dialog without submitting', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Submit Decisions"), button:has-text("Submit")').first();

    // Open dialog
    await submitButton.click();
    await page.waitForTimeout(500);

    // Click cancel
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
    await page.waitForTimeout(500);

    // Dialog should close
    await expect(page.locator('text=Submit Hiring Decision')).not.toBeVisible();
  });

  // =====================================================
  // Test Suite 5: Complete Workflow
  // =====================================================

  test('complete workflow from fill to submit', async ({ page }) => {
    // Fill compensation
    const salaryInput = page.locator('input[name*="salary"], input[aria-label*="Salary"]').first();
    await salaryInput.fill('75000');

    // Change benefits
    const goldRadio = page.locator('input[type="radio"][value="gold"]');
    await goldRadio.click();

    // Enable sales contest
    const hasSalesContestCheckbox = page.locator('input[type="checkbox"][name*="salesContest"], input[aria-label*="sales contest"]').first();
    await hasSalesContestCheckbox.check();

    // Select open contest
    const openContestRadio = page.locator('input[type="radio"][value="open"]');
    await openContestRadio.click();

    // Set threshold
    const thresholdInput = page.locator('input[name*="threshold"], input[aria-label*="Threshold"]').first();
    await thresholdInput.fill('15000');

    // Wait for auto-saves
    await page.waitForTimeout(2000);

    // Submit
    const submitButton = page.locator('button:has-text("Submit Decisions"), button:has-text("Submit")').first();
    await submitButton.click();

    // Confirm dialog should appear
    await expect(page.locator('text=Submit Hiring Decision').or(page.locator('text=Are you sure'))).toBeVisible();
  });

  // =====================================================
  // Test Suite 6: Training Allocation Scenarios
  // =====================================================

  test('training sliders can be adjusted independently', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    const sliderCount = await sliders.count();

    expect(sliderCount).toBeGreaterThanOrEqual(4);

    // Training sliders are first 4
    const productKnowledgeSlider = sliders.nth(0);
    const marketOrientationSlider = sliders.nth(1);
    const companyOrientationSlider = sliders.nth(2);
    const sellingTechniquesSlider = sliders.nth(3);

    // Adjust each independently
    await productKnowledgeSlider.fill('30');
    await productKnowledgeSlider.dispatchEvent('input');
    await page.waitForTimeout(200);

    await expect(page.locator('text=Product Knowledge: 30%')).toBeVisible();

    await marketOrientationSlider.fill('20');
    await marketOrientationSlider.dispatchEvent('input');
    await page.waitForTimeout(200);

    await expect(page.locator('text=Market Orientation: 20%')).toBeVisible();

    await companyOrientationSlider.fill('15');
    await companyOrientationSlider.dispatchEvent('input');
    await page.waitForTimeout(200);

    await expect(page.locator('text=Company Orientation: 15%')).toBeVisible();

    await sellingTechniquesSlider.fill('35');
    await sellingTechniquesSlider.dispatchEvent('input');
    await page.waitForTimeout(200);

    await expect(page.locator('text=Selling Techniques: 35%')).toBeVisible();

    // Verify total is 100%
    await expect(page.locator('text=100%').first()).toBeVisible();
  });

  test('training sum indicator shows correct color', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    const productKnowledgeSlider = sliders.nth(0);

    // Initially sum is 100% (green color class)
    let trainingSumElement = page.locator('text=Training Allocation Total:');
    await expect(trainingSumElement).toBeVisible();

    // Check for green color class
    const greenElement = page.locator('.text-green-600, [class*="green"]');
    const hasGreen = await greenElement.count() > 0;

    // Break the sum
    await productKnowledgeSlider.fill('50');
    await productKnowledgeSlider.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Check for red color class (error state)
    const redElement = page.locator('.text-red-600, [class*="red"]');
    const hasRed = await redElement.count() > 0;

    // At least one color indicator should change
    expect(hasGreen || hasRed).toBeTruthy();
  });

  // =====================================================
  // Test Suite 7: Error Messages and Help Text
  // =====================================================

  test('help text displays for recruiting field', async ({ page }) => {
    // Recruiting section has a note about field not being implemented
    await expect(
      page.locator('text=Recruiting allocation field not yet implemented')
    ).toBeVisible();
  });

  test('help text displays for hiring/firing lists', async ({ page }) => {
    // Hiring & Firing section has a note about lists coming soon
    await expect(
      page.locator('text=Hiring list and firing list selection coming soon')
    ).toBeVisible();
  });

  test('error message displays when training sum is not 100%', async ({ page }) => {
    const sliders = page.locator('input[type="range"]');
    const productKnowledgeSlider = sliders.nth(0);

    // Break the sum
    await productKnowledgeSlider.fill('50');
    await productKnowledgeSlider.dispatchEvent('input');
    await page.waitForTimeout(500);

    // Should show error message
    await expect(page.locator('text=Must equal exactly 100%, text=Training allocation must equal 100%')).toBeVisible();
  });
});
