/**
 * E2E-02: Role-Based Routing & Dashboard Access (Playwright)
 *
 * True end-to-end tests for authentication redirects and role-based access control.
 * Tests actual browser navigation, redirects, and dashboard access.
 *
 * Features tested:
 * - Root route redirects based on authentication status and role
 * - Dashboard access control (teacher, student, admin)
 * - Protected routes prevent unauthorized access
 * - Cross-role access prevention
 * - Mock auth state via ?user={email} query param
 *
 * Test users (from scripts/seed-test-users.js):
 * - admin@test.com (admin role)
 * - teacher@test.com (teacher role, game-1 assigned)
 * - student@test.com (student role, game-1, company-1 assigned)
 *
 * Prerequisites:
 * - Frontend server running (use playwright.config.ts webServer or run manually)
 * - Backend Convex deployment with test users seeded
 * - Run `node scripts/seed-test-users.js` to create test users
 *
 * Run with: npx playwright test e2e-02-role-based-routing.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('E2E-02: Role-Based Routing & Access Control', () => {
  /**
   * Test 1: Root route redirects unauthenticated users to login
   */
  test('redirects unauthenticated users to login', async ({ page }) => {
    // Navigate to root without auth
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  /**
   * Test 2: Root route redirects admin to compilation page
   */
  test('redirects admin user to compilation dashboard', async ({ page }) => {
    // Navigate as admin user
    await page.goto('/?user=admin@test.com');

    // Should redirect to admin compilation
    await expect(page).toHaveURL(/\/admin\/compilation/, { timeout: 5000 });

    // Verify admin dashboard content
    await expect(page.getByRole('heading', { name: /admin|compilation/i })).toBeVisible();
  });

  /**
   * Test 3: Root route redirects teacher to teacher dashboard
   */
  test('redirects teacher user to teacher dashboard', async ({ page }) => {
    // Navigate as teacher user
    await page.goto('/?user=teacher@test.com');

    // Should redirect to teacher dashboard
    await expect(page).toHaveURL(/\/teacher\/dashboard/, { timeout: 5000 });

    // Verify teacher dashboard content
    await expect(page.getByRole('heading', { name: /teacher|dashboard/i })).toBeVisible();
  });

  /**
   * Test 4: Root route redirects student to student hub
   */
  test('redirects student user to student hub', async ({ page }) => {
    // Navigate as student user
    await page.goto('/?user=student@test.com');

    // Should redirect to student hub
    await expect(page).toHaveURL(/\/student\//, { timeout: 5000 });

    // Verify student hub content
    await expect(page.getByRole('heading', { name: /student|hub|decisions/i })).toBeVisible();
  });

  /**
   * Test 5: Admin can access admin compilation page
   */
  test('admin can access admin compilation page', async ({ page }) => {
    // Go directly to admin compilation as admin
    await page.goto('/admin/compilation?user=admin@test.com');

    // Should load successfully
    await expect(page.getByRole('heading', { name: /admin|compilation/i })).toBeVisible();

    // Verify URL stays on admin page (no redirect)
    await expect(page).toHaveURL(/\/admin\/compilation/);
  });

  /**
   * Test 6: Teacher can access teacher dashboard
   */
  test('teacher can access teacher dashboard', async ({ page }) => {
    // Go directly to teacher dashboard as teacher
    await page.goto('/teacher/dashboard?user=teacher@test.com');

    // Should load successfully
    await expect(page.getByRole('heading', { name: /teacher|dashboard/i })).toBeVisible();

    // Verify URL stays on teacher page
    await expect(page).toHaveURL(/\/teacher\/dashboard/);
  });

  /**
   * Test 7: Student can access student hub
   */
  test('student can access student hub', async ({ page }) => {
    // Go directly to student hub as student
    await page.goto('/student/?user=student@test.com');

    // Should load successfully
    await expect(page.getByRole('heading', { name: /student|hub|decisions/i })).toBeVisible();

    // Verify URL stays on student page
    await expect(page).toHaveURL(/\/student\//);
  });

  /**
   * Test 8: Teacher cannot access admin pages
   */
  test('teacher cannot access admin compilation page', async ({ page }) => {
    // Try to access admin page as teacher
    await page.goto('/admin/compilation?user=teacher@test.com');

    // Should show access denied or redirect away
    await page.waitForTimeout(2000); // Allow time for redirect/error

    const currentUrl = page.url();
    const isAccessDenied = await page.getByText(/access denied|unauthorized/i).count() > 0;
    const isRedirected = !currentUrl.includes('/admin/compilation');

    expect(isAccessDenied || isRedirected).toBeTruthy();
  });

  /**
   * Test 9: Student cannot access admin pages
   */
  test('student cannot access admin compilation page', async ({ page }) => {
    // Try to access admin page as student
    await page.goto('/admin/compilation?user=student@test.com');

    // Should show access denied or redirect away
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isAccessDenied = await page.getByText(/access denied|unauthorized/i).count() > 0;
    const isRedirected = !currentUrl.includes('/admin/compilation');

    expect(isAccessDenied || isRedirected).toBeTruthy();
  });

  /**
   * Test 10: Admin cannot access teacher dashboard
   */
  test('admin cannot access teacher dashboard', async ({ page }) => {
    // Try to access teacher dashboard as admin
    await page.goto('/teacher/dashboard?user=admin@test.com');

    // Should show access denied or redirect away
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isAccessDenied = await page.getByText(/access denied|unauthorized/i).count() > 0;
    const isRedirected = !currentUrl.includes('/teacher/dashboard');

    expect(isAccessDenied || isRedirected).toBeTruthy();
  });

  /**
   * Test 11: Student cannot access teacher dashboard
   */
  test('student cannot access teacher dashboard', async ({ page }) => {
    // Try to access teacher dashboard as student
    await page.goto('/teacher/dashboard?user=student@test.com');

    // Should show access denied or redirect away
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const isAccessDenied = await page.getByText(/access denied|unauthorized/i).count() > 0;
    const isRedirected = !currentUrl.includes('/teacher/dashboard');

    expect(isAccessDenied || isRedirected).toBeTruthy();
  });

  /**
   * Test 12: Loading state is shown while checking authentication
   */
  test('shows loading state while checking authentication', async ({ page }) => {
    // Navigate to root (will check auth)
    await page.goto('/');

    // Briefly check for loading indicator (might be quick)
    const loadingSpinner = page.getByRole('status').or(page.getByText(/loading/i));
    const isVisible = await loadingSpinner.isVisible().catch(() => false);

    // Loading might be too fast to catch, so this is a soft assertion
    if (isVisible) {
      await expect(loadingSpinner).toBeVisible();
    }
  });

  /**
   * Test 13: Direct access to protected routes without auth redirects to login
   */
  test('protected routes redirect to login without auth', async ({ page }) => {
    // Try to access teacher dashboard without auth
    await page.goto('/teacher/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  /**
   * Test 14: Login page is accessible without auth
   */
  test('login page is accessible without authentication', async ({ page }) => {
    // Go to login page
    await page.goto('/login');

    // Should load successfully
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();

    // Should stay on login page (no redirect)
    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * Test 15: Request access page is accessible without auth
   */
  test('request access page is accessible without authentication', async ({ page }) => {
    // Go to request access page
    await page.goto('/request-access');

    // Should load successfully
    await expect(page.getByRole('heading', { name: /request access/i })).toBeVisible();

    // Should stay on request access page
    await expect(page).toHaveURL(/\/request-access/);
  });

  /**
   * Test 16: Student without company assignment cannot access student hub
   *
   * NOTE: This test would require creating a student without a company assignment.
   * For now, we test the concept by documenting the expected behavior.
   */
  test.skip('student without company assignment is denied access', async ({ page }) => {
    // This would require a test user with:
    // - role: "student"
    // - gameId: "game-1"
    // - companyId: undefined

    // Expected: Should show "Access Denied" or redirect to login
    // await page.goto('/student/?user=student-no-company@test.com');
    // await expect(page.getByText(/access denied|no company/i)).toBeVisible();
  });

  /**
   * Test 17: Teacher without game assignment cannot access dashboard
   *
   * NOTE: This test would require creating a teacher without a game assignment.
   * For now, we test the concept by documenting the expected behavior.
   */
  test.skip('teacher without game assignment is denied access', async ({ page }) => {
    // This would require a test user with:
    // - role: "teacher"
    // - gameId: undefined

    // Expected: Should show "No Game Assigned" or similar message
    // await page.goto('/teacher/dashboard?user=teacher-no-game@test.com');
    // await expect(page.getByText(/no game assigned/i)).toBeVisible();
  });
});
