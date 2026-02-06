import { test, expect } from '@playwright/test';

test.describe('Role-Based Navigation', () => {
  test.describe('Admin Role', () => {
    test('admin redirect to compilation dashboard', async ({ page }) => {
      // Navigate with admin user query param (for testing)
      await page.goto('/?user=admin@test.com');

      // Wait a moment for redirect
      await page.waitForTimeout(1000);

      const url = page.url();
      const hasAdminContent = await page.locator('text=Admin').or(page.locator('text=Compilation')).count() > 0;

      // Should be on admin page or have admin content
      expect(url.includes('/admin') || hasAdminContent).toBeTruthy();
    });

    test('admin cannot access student areas', async ({ page }) => {
      await page.goto('/?user=admin@test.com');
      await page.waitForTimeout(1000);

      // Try to navigate to student area
      await page.goto('/student/hiring');

      // Should redirect away or show access denied
      await page.waitForTimeout(1000);
      const url = page.url();
      const hasAccessDenied = await page.locator('text=access').or(page.locator('text=denied')).count() > 0;

      expect(url.includes('/admin') || url.includes('/login') || hasAccessDenied).toBeTruthy();
    });
  });

  test.describe('Teacher Role', () => {
    test('teacher redirect to teacher dashboard', async ({ page }) => {
      await page.goto('/?user=teacher@test.com');
      await page.waitForTimeout(1000);

      const url = page.url();
      const hasTeacherContent = await page.locator('text=Teacher').or(page.locator('text=Dashboard')).count() > 0;

      // Should be on teacher page or have teacher content
      expect(url.includes('/teacher') || hasTeacherContent).toBeTruthy();
    });

    test('teacher can view game overview', async ({ page }) => {
      await page.goto('/?user=teacher@test.com');
      await page.waitForTimeout(1000);

      // Look for game/company related content
      const hasGameContent = await page.locator('text=Game').or(page.locator('text=Company')).or(page.locator('text=Overview')).count() > 0;

      expect(hasGameContent).toBeTruthy();
    });
  });

  test.describe('Student Role', () => {
    test('student redirect to student hub', async ({ page }) => {
      await page.goto('/?role=student');
      await page.waitForTimeout(1000);

      const url = page.url();
      const hasStudentContent = await page.locator('text=Student').or(page.locator('text=Hub')).count() > 0;

      // Should be on student page or have student content
      expect(url.includes('/student') || hasStudentContent).toBeTruthy();
    });

    test('student can access hiring page', async ({ page }) => {
      await page.goto('/?role=student');
      await page.waitForTimeout(1000);

      // Navigate to hiring
      await page.goto('/student/hiring');
      await page.waitForTimeout(500);

      const url = page.url();
      const hasHiringContent = await page.locator('text=Hiring').or(page.locator('text=Decision')).count() > 0;

      expect(url.includes('/student/hiring') || hasHiringContent).toBeTruthy();
    });

    test('student cannot access admin areas', async ({ page }) => {
      await page.goto('/?role=student');
      await page.waitForTimeout(1000);

      // Try to access admin
      await page.goto('/admin/compilation');

      // Should redirect away
      await page.waitForTimeout(1000);
      const url = page.url();
      const hasAccessDenied = await page.locator('text=access').or(page.locator('text=denied')).count() > 0;

      expect(!url.includes('/admin') || hasAccessDenied).toBeTruthy();
    });
  });

  test.describe('Unauthenticated Access', () => {
    test('unauthenticated user redirected to login or request-access', async ({ page }) => {
      await page.goto('/');

      // Wait for redirect
      await page.waitForTimeout(1000);

      const url = page.url();
      const hasAuthForm = await page.locator('input[name="email"]').or(page.locator('text=Request Access')).count() > 0;

      expect(url.includes('/login') || url.includes('/request-access') || hasAuthForm).toBeTruthy();
    });
  });
});
