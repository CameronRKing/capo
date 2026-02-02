/**
 * E2E-01: Authentication & Access Request Flow (Browser Mode)
 *
 * True end-to-end test that runs in a real browser using Vitest browser mode.
 * Tests the complete user access workflow through the actual UI.
 *
 * Prerequisites:
 * - Dev server must be running: `npm run dev`
 * - Convex backend must be available
 *
 * Run with: `npm run test:e2e -- e2e-01-browser`
 */

import { test, expect } from "vitest";

/**
 * Test 1: Student access request - full flow
 *
 * Verifies that a student can:
 * - Submit an access request
 * - Be approved by admin with game/company assignment
 * - Sign in with magic link (mocked)
 * - Be redirected to student dashboard
 */
test("E2E-01: Student access request - full flow", async ({ page }) => {
  // Step 1: Navigate to access request page
  await page.goto("/request-access");

  // Step 2: Fill out access request form
  await page.fill('[name="name"]', "Alice Student");
  await page.fill('[name="email"]', "alice@student.com");
  await page.selectOption('[name="role"]', "student");

  // Step 3: Submit request
  await page.click('button[type="submit"]');

  // Step 4: Verify success message
  await expect(page.locator("text=Request submitted")).toBeVisible();
  await expect(page.locator("text=pending approval")).toBeVisible();

  // Step 5: Login as admin
  await page.goto("/admin/login");
  // TODO: Add admin login when implemented
  // await page.fill('[name="email"]', "admin@test.com");
  // await page.click('button[type="submit"]');

  // Step 6: Navigate to access requests page
  await page.goto("/admin/access");

  // Step 7: Find and approve the request
  const requestRow = page.locator(`text=alice@student.com`);
  await expect(requestRow).toBeVisible();

  // Step 8: Click approve and assign game/company
  await page.click(`button:has-text("Approve")`);
  await page.selectOption("#game", "test-game");
  await page.selectOption("#company", "company-a");
  await page.click('button:has-text("Confirm")');

  // Step 9: Verify approval
  await expect(page.locator("text=Approved")).toBeVisible();

  // Step 10: Student signs in
  // In real flow, they'd click magic link from email
  // For testing, we simulate magic link redirect
  await page.goto("/login?token=mock-magic-link-token");

  // Step 11: Verify redirected to student dashboard
  await expect(page).toHaveURL(/\/student/);
  await expect(page.locator("h1:has-text('Student Dashboard')")).toBeVisible();
});

/**
 * Test 2: Teacher access request - full flow
 */
test("E2E-01: Teacher access request - full flow", async ({ page }) => {
  await page.goto("/request-access");

  await page.fill('[name="name"]', "Bob Teacher");
  await page.fill('[name="email"]', "bob@teacher.com");
  await page.selectOption('[name="role"]', "teacher");

  await page.click('button[type="submit"]');
  await expect(page.locator("text=Request submitted")).toBeVisible();

  // Admin approves
  await page.goto("/admin/access");
  const requestRow = page.locator(`text=bob@teacher.com`);
  await expect(requestRow).toBeVisible();

  await page.click(`button:has-text("Approve")`);
  await page.selectOption("#game", "test-game");
  await page.selectOption("#company", "company-a");
  await page.click('button:has-text("Confirm")');

  // Teacher signs in
  await page.goto("/login?token=mock-magic-link-token");

  // Verify redirected to teacher dashboard
  await expect(page).toHaveURL(/\/teacher/);
  await expect(page.locator("h1:has-text('Teacher Dashboard')")).toBeVisible();
});

/**
 * Test 3: Cannot submit duplicate access request
 */
test("E2E-01: Cannot submit duplicate access request", async ({ page }) => {
  const email = "duplicate@test.com";

  // Submit first request
  await page.goto("/request-access");
  await page.fill('[name="name"]', "Duplicate User");
  await page.fill('[name="email"]', email);
  await page.selectOption('[name="role"]', "student");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Request submitted")).toBeVisible();

  // Try to submit duplicate request
  await page.goto("/request-access");
  await page.fill('[name="name"]', "Duplicate User");
  await page.fill('[name="email"]', email);
  await page.selectOption('[name="role"]', "student");
  await page.click('button[type="submit"]');

  // Should show error
  await expect(page.locator("text=already pending")).toBeVisible();
});

/**
 * Test 4: Role-based dashboard redirects
 */
test("E2E-01: Role-based dashboard redirects", async ({ page }) => {
  // Student redirects to student dashboard
  await page.goto("/login?token=student-token");
  await expect(page).toHaveURL(/\/student/);

  // Teacher redirects to teacher dashboard
  await page.goto("/login?token=teacher-token");
  await expect(page).toHaveURL(/\/teacher/);

  // Admin redirects to admin dashboard
  await page.goto("/login?token=admin-token");
  await expect(page).toHaveURL(/\/admin/);
});
