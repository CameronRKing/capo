/**
 * Authentication Helper Functions for E2E Tests
 *
 * High-level helpers for authentication workflows.
 * These helpers orchestrate page interactions and assertions.
 */

import type { Page } from "vitest";
import { RequestAccessPage, AdminAccessPage, LoginPage, DashboardPage } from "./page-objects";

/**
 * Submit an access request via the request form
 *
 * Fills out the form, submits it, and waits for the success message.
 *
 * @param page - Vitest page object
 * @param data - Request form data
 */
export async function submitAccessRequest(
  page: Page,
  data: {
    name: string;
    email: string;
    role: "teacher" | "student";
  }
): Promise<void> {
  await RequestAccessPage.goto(page);
  await RequestAccessPage.fillForm(page, data);
  await RequestAccessPage.submit(page);

  // Wait for success message
  await page.waitForTimeout(500);
}

/**
 * Navigate to admin dashboard and approve a request
 *
 * Switches to pending tab, finds the request, clicks approve,
 * and fills in the approval modal.
 *
 * @param page - Vitest page object
 * @param options - Approval options
 */
export async function approveAccessRequest(
  page: Page,
  options: {
    requestEmail: string;
    gameId: string;
    companyId?: string;
  }
): Promise<void> {
  // Ensure we're on the pending tab
  await AdminAccessPage.switchToPendingTab(page);

  // Wait for requests to load
  await page.waitForTimeout(500);

  // Click approve button for the request
  await AdminAccessPage.clickApprove(page, options.requestEmail);

  // Fill in and submit the approval modal
  await AdminAccessPage.approveInModal(page, {
    gameId: options.gameId,
    companyId: options.companyId,
  });

  // Wait for modal to close and request to be removed from list
  await page.waitForTimeout(1000);
}

/**
 * Navigate to login page and send magic link
 *
 * @param page - Vitest page object
 * @param email - Email address to send magic link to
 */
export async function sendMagicLink(page: Page, email: string): Promise<void> {
  await LoginPage.goto(page);
  await LoginPage.enterEmail(page, email);
  await LoginPage.submit(page);
  await LoginPage.waitForSuccessMessage(page);
}

/**
 * Sign in using a magic link token
 *
 * Navigates directly to the auth callback URL with the token.
 * This bypasses the email click in tests.
 *
 * @param page - Vitest page object
 * @param token - Magic link token
 */
export async function signInWithToken(page: Page, token: string): Promise<void> {
  // Navigate to auth callback with token
  // The token is usually in format: /auth/callback?token=...
  await page.goto(`/auth/callback?token=${encodeURIComponent(token)}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for and assert redirect to expected path
 *
 * @param page - Vitest page object
 * @param expectedPath - Expected URL path
 * @param timeout - Optional timeout in ms (default: 5000)
 */
export async function waitForRedirect(
  page: Page,
  expectedPath: string,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentPath = new URL(page.url()).pathname;
    if (currentPath === expectedPath) {
      return;
    }
    await page.waitForTimeout(100);
  }

  throw new Error(
    `Expected redirect to ${expectedPath}, but got ${new URL(page.url()).pathname}`
  );
}

/**
 * Sign out the current user
 *
 * Note: This depends on your app's sign-out implementation.
 * Adjust the selector/logic as needed.
 *
 * @param page - Vitest page object
 */
export async function signOut(page: Page): Promise<void> {
  // Look for a sign out button/link
  // This is a placeholder - adjust based on your UI
  const signOutButton = page.locator('button:has-text("Sign out"), a:has-text("Sign out")');

  if (await signOutButton.count() > 0) {
    await signOutButton.click();
    await page.waitForLoadState("networkidle");
  } else {
    // Alternative: Navigate to logout URL directly
    await page.goto("/auth/signout");
    await page.waitForLoadState("networkidle");
  }
}

/**
 * Get the current authenticated user from the page
 *
 * This function attempts to extract user information from the page.
 * In a real app, you might:
 * - Check for a user profile element
 * - Make an API call to Convex
 * - Read from localStorage
 *
 * @param page - Vitest page object
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(page: Page): Promise<{
  name: string;
  email: string;
  role: string;
} | null> {
  try {
    // Method 1: Check URL to infer role
    const path = new URL(page.url()).pathname;
    if (path.startsWith("/admin")) return { name: "", email: "", role: "admin" };
    if (path.startsWith("/teacher")) return { name: "", email: "", role: "teacher" };
    if (path.startsWith("/student")) return { name: "", email: "", role: "student" };

    // Method 2: Look for user info in the page
    // This is a placeholder - adjust based on your UI
    const userElement = page.locator('[data-user-email], [data-user-name], [data-user-role]');
    if (await userElement.count() > 0) {
      const email = await userElement.getAttribute("data-user-email");
      const name = await userElement.getAttribute("data-user-name");
      const role = await userElement.getAttribute("data-user-role");

      if (email || name || role) {
        return {
          email: email ?? "",
          name: name ?? "",
          role: role ?? "",
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Wait for user to be authenticated
 *
 * Polls until user is on an authenticated page (not login/auth).
 *
 * @param page - Vitest page object
 * @param timeout - Optional timeout in ms (default: 5000)
 */
export async function waitForAuthentication(page: Page, timeout = 5000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isAuthenticated = await DashboardPage.isAuthenticated(page);
    if (isAuthenticated) {
      return;
    }
    await page.waitForTimeout(100);
  }

  throw new Error("User was not authenticated within timeout period");
}

/**
 * Complete full authentication flow for a user
 *
 * Helper that combines sending magic link and signing in.
 *
 * @param page - Vitest page object
 * @param email - User's email address
 * @param token - Magic link token (from mock Resend service)
 * @param expectedRedirect - Expected path after sign-in
 */
export async function authenticateUser(
  page: Page,
  email: string,
  token: string,
  expectedRedirect: string
): Promise<void> {
  await sendMagicLink(page, email);
  await signInWithToken(page, token);
  await waitForRedirect(page, expectedRedirect);
}

/**
 * Assert that user is on a specific dashboard
 *
 * @param page - Vitest page object
 * @param expectedRole - Expected user role (admin, teacher, student)
 */
export async function assertDashboard(page: Page, expectedRole: "admin" | "teacher" | "student"): Promise<void> {
  const currentRole = await DashboardPage.getUserRole(page);

  if (currentRole !== expectedRole) {
    throw new Error(
      `Expected user to be on ${expectedRole} dashboard, but got ${currentRole}`
    );
  }

  // Additional checks based on role
  switch (expectedRole) {
    case "admin":
      if (!(await DashboardPage.isAdminDashboard(page))) {
        throw new Error("Not on admin dashboard");
      }
      break;
    case "teacher":
      if (!(await DashboardPage.isTeacherDashboard(page))) {
        throw new Error("Not on teacher dashboard");
      }
      break;
    case "student":
      if (!(await DashboardPage.isStudentDashboard(page))) {
        throw new Error("Not on student dashboard");
      }
      break;
  }
}
