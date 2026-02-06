/**
 * E2E-01: Authentication & Access Request Flow (Playwright)
 *
 * True end-to-end tests for the access request form using Playwright.
 * Tests form validation, role selection, and submission.
 *
 * Features tested:
 * - Form renders with all fields
 * - Validation shows errors for empty/invalid fields
 * - Email format validation
 * - Role selection highlights correctly
 * - Form clears errors when user starts typing
 * - Form submission with loading state
 *
 * Prerequisites:
 * - Frontend server running (use playwright.config.ts webServer or run manually)
 * - Backend Convex deployment available
 *
 * Run with: npx playwright test e2e-01-access-request.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('E2E-01: Access Request Form', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to access request page
    await page.goto('/request-access');
  });

  /**
   * Test 1: Access request form renders correctly
   *
   * Verifies that the form displays properly
   */
  test('renders correctly with all fields', async ({ page }) => {
    // Verify heading
    await expect(page.getByRole('heading', { name: 'Request Access' })).toBeVisible();

    // Verify form fields exist
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();

    // Verify role selection options
    const radios = await page.getByRole('radio').all();
    expect(radios).toHaveLength(2);

    // Verify submit button
    await expect(page.getByRole('button', { name: /submit request/i })).toBeVisible();
  });

  /**
   * Test 2: Form validation shows errors for empty fields
   */
  test('shows validation errors for empty fields', async ({ page }) => {
    // Submit without filling form
    await page.getByRole('button', { name: /submit request/i }).click();

    // Wait for validation errors to appear
    await expect(page.getByText('Name is required')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 3: Form validates email format
   */
  test('validates email format', async ({ page }) => {
    // Fill name
    await page.getByLabel(/full name/i).fill('Test User');

    // Fill invalid email
    await page.getByLabel(/email address/i).fill('invalid-email');

    // Select student role
    await page.getByText('Student').click();

    // Submit the form
    await page.getByRole('button', { name: /submit request/i }).click();

    // Should show email validation error
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();
  });

  /**
   * Test 4: Form submission shows loading state
   *
   * NOTE: With real backend, this tests the actual submission flow
   */
  test('shows loading state during submission', async ({ page }) => {
    // Fill form with valid data
    await page.getByLabel(/full name/i).fill('Alice Student');
    await page.getByLabel(/email address/i).fill('alice@student.com');
    await page.getByText('Student').click();

    // Submit form
    await page.getByRole('button', { name: /submit request/i }).click();

    // Should show loading state (button text changes)
    // Note: This may fail if backend is not properly configured
    await expect(page.getByText(/submitting/i, { exact: false })).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 5: Role selection highlights correctly
   */
  test('role selection highlights correctly', async ({ page }) => {
    // Get radios by value
    const teacherRadio = await page.getByRole('radio', { name: /teacher/i }).elementHandle();
    const studentRadio = await page.getByRole('radio', { name: /student/i }).elementHandle();

    expect(teacherRadio).toBeDefined();
    expect(studentRadio).toBeDefined();

    // Click teacher role
    await page.getByText('Teacher').click();

    // Verify teacher is checked
    await expect(page.getByRole('radio', { name: /teacher/i })).toBeChecked();

    // Click student role
    await page.getByText('Student').click();

    // Verify student is now checked and teacher is not
    await expect(page.getByRole('radio', { name: /student/i })).toBeChecked();
    await expect(page.getByRole('radio', { name: /teacher/i })).not.toBeChecked();
  });

  /**
   * Test 6: Form clears errors when user starts typing
   */
  test('clears errors when user starts typing', async ({ page }) => {
    // Submit without filling form
    await page.getByRole('button', { name: /submit request/i }).click();

    // Should show errors
    await expect(page.getByText('Name is required')).toBeVisible();

    // Start typing in name field
    await page.getByLabel(/full name/i).fill('Test');

    // Name error should clear
    await expect(page.getByText('Name is required')).not.toBeVisible();
  });
});
