/**
 * Page Object Models for E2E Tests
 *
 * Encapsulates page-specific selectors and actions for cleaner tests.
 * Each page object provides methods for common interactions.
 *
 * Based on the Page Object Model pattern:
 * https://playwright.dev/docs/pom
 */

import type { Page } from "vitest";

/**
 * Page Object for /request-access
 */
export class RequestAccessPage {
  /**
   * Navigate to the request access page
   */
  static async goto(page: Page): Promise<void> {
    await page.goto("/request-access");
    await page.waitForLoadState("networkidle");
  }

  /**
   * Fill out the request access form
   */
  static async fillForm(
    page: Page,
    data: {
      name: string;
      email: string;
      role: "teacher" | "student";
    }
  ): Promise<void> {
    // Fill name field
    const nameInput = page.locator('input#name');
    await nameInput.fill(data.name);

    // Fill email field
    const emailInput = page.locator('input#email');
    await emailInput.fill(data.email);

    // Select role radio button
    const roleSelector = `input[name="role"][value="${data.role}"]`;
    const roleRadio = page.locator(roleSelector);
    await roleRadio.click();
  }

  /**
   * Submit the form
   */
  static async submit(page: Page): Promise<void> {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
  }

  /**
   * Get the success message after submission
   */
  static async getSuccessMessage(page: Page): Promise<string | null> {
    const successElement = page.locator('text=Request Submitted!');
    if (await successElement.count() > 0) {
      return await successElement.textContent();
    }
    return null;
  }

  /**
   * Get the error message (if any)
   */
  static async getErrorMessage(page: Page): Promise<string | null> {
    // Check for error div
    const errorDiv = page.locator('.bg-red-50, .bg-red-900\\/20');
    if (await errorDiv.count() > 0) {
      return await errorDiv.textContent();
    }
    return null;
  }

  /**
   * Check if form is in submitted state
   */
  static async isSubmitted(page: Page): Promise<boolean> {
    const successMsg = page.locator('text=Request Submitted!');
    return (await successMsg.count()) > 0;
  }
}

/**
 * Page Object for /admin/access
 */
export class AdminAccessPage {
  /**
   * Navigate to the admin access page
   */
  static async goto(page: Page): Promise<void> {
    await page.goto("/admin/access");
    await page.waitForLoadState("networkidle");
  }

  /**
   * Get the list of pending requests
   */
  static async getRequestList(page: Page): Promise<
    Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>
  > {
    const requests: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }> = [];

    // Wait for request list to load
    const requestItems = page.locator('li[class*="p-6"]');
    const count = await requestItems.count();

    for (let i = 0; i < count; i++) {
      const item = requestItems.nth(i);

      // Extract request data from the UI
      const name = (await item.locator('h3').textContent()) ?? "";
      const email = (await item.locator('p[class*="text-sm"]').textContent()) ?? "";
      const roleText = await item.locator('span[class*="inline-flex"]').textContent();

      requests.push({
        id: `request-${i}`, // We can't easily get the ID from UI
        name: name.trim(),
        email: email.trim(),
        role: roleText?.toLowerCase() ?? "",
      });
    }

    return requests;
  }

  /**
   * Find a request by email and click the approve button
   */
  static async clickApprove(page: Page, requestEmail: string): Promise<void> {
    // Find the request item containing the email
    const requestItem = page.locator(`li:has-text("${requestEmail}")`);
    await requestItem.waitFor();

    // Click the approve button within that item
    const approveButton = requestItem.locator('button:has-text("Approve")');
    await approveButton.click();
  }

  /**
   * Fill in and submit the approval modal
   */
  static async approveInModal(
    page: Page,
    options: {
      gameId: string;
      companyId?: string;
    }
  ): Promise<void> {
    // Wait for modal to appear
    const modal = page.locator('div[class*="fixed"][class*="z-50"]');
    await modal.waitFor();

    // Select game (required)
    const gameSelect = modal.locator('select').first();
    await gameSelect.selectOption({ index: 1 }); // Select first game option

    // If companyId provided, select company
    if (options.companyId) {
      const companySelect = modal.locator('select').nth(1);
      await companySelect.selectOption({ index: 1 }); // Select first company option
    }

    // Click approve button
    const approveButton = modal.locator('button:has-text("Approve Request")');
    await approveButton.click();

    // Wait for modal to close
    await modal.waitFor({ state: "hidden" });
  }

  /**
   * Deny a request
   */
  static async denyRequest(page: Page, requestEmail: string): Promise<void> {
    const requestItem = page.locator(`li:has-text("${requestEmail}")`);
    await requestItem.waitFor();

    // Note: This will trigger a confirmation dialog
    page.on("dialog", (dialog) => dialog.accept());

    const denyButton = requestItem.locator('button:has-text("Deny")');
    await denyButton.click();
  }

  /**
   * Switch to pending requests tab
   */
  static async switchToPendingTab(page: Page): Promise<void> {
    const tabButton = page.locator('button:has-text("Pending Requests")');
    await tabButton.click();
  }

  /**
   * Switch to direct grant tab
   */
  static async switchToDirectGrantTab(page: Page): Promise<void> {
    const tabButton = page.locator('button:has-text("Direct Grant")');
    await tabButton.click();
  }

  /**
   * Check if there are no pending requests
   */
  static async hasNoPendingRequests(page: Page): Promise<boolean> {
    const emptyState = page.locator('text=No pending requests');
    return (await emptyState.count()) > 0;
  }
}

/**
 * Page Object for /login
 */
export class LoginPage {
  /**
   * Navigate to the login page
   */
  static async goto(page: Page): Promise<void> {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
  }

  /**
   * Enter email in the login form
   */
  static async enterEmail(page: Page, email: string): Promise<void> {
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(email);
  }

  /**
   * Submit the login form
   */
  static async submit(page: Page): Promise<void> {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
  }

  /**
   * Wait for the success message (email sent)
   */
  static async waitForSuccessMessage(page: Page): Promise<void> {
    const successMsg = page.locator('text=Check your email');
    await successMsg.waitFor();
  }

  /**
   * Get the error message (if any)
   */
  static async getErrorMessage(page: Page): Promise<string | null> {
    const errorDiv = page.locator('.bg-red-50, .bg-red-900\\/20');
    if (await errorDiv.count() > 0) {
      return await errorDiv.textContent();
    }
    return null;
  }

  /**
   * Check if magic link was sent (success state)
   */
  static async isMagicLinkSent(page: Page): Promise<boolean> {
    const successMsg = page.locator('text=Check your email');
    return (await successMsg.count()) > 0;
  }
}

/**
 * Page Object for dashboards (teacher, student, admin)
 */
export class DashboardPage {
  /**
   * Wait for the dashboard to load
   */
  static async waitForLoad(page: Page): Promise<void> {
    await page.waitForLoadState("networkidle");
    // Wait for some dashboard-specific content
    await page.waitForTimeout(500);
  }

  /**
   * Get the current URL path
   */
  static async getCurrentPath(page: Page): Promise<string> {
    return new URL(page.url()).pathname;
  }

  /**
   * Get the current user's role from the page
   */
  static async getUserRole(page: Page): Promise<string | null> {
    // This is a placeholder - actual implementation depends on UI
    // You might check for specific elements or make an API call
    const url = new URL(page.url()).pathname;

    if (url.startsWith("/admin")) return "admin";
    if (url.startsWith("/teacher")) return "teacher";
    if (url.startsWith("/student")) return "student";

    return null;
  }

  /**
   * Check if this is the teacher dashboard
   */
  static async isTeacherDashboard(page: Page): Promise<boolean> {
    const path = new URL(page.url()).pathname;
    return path === "/teacher/dashboard";
  }

  /**
   * Check if this is the student dashboard
   */
  static async isStudentDashboard(page: Page): Promise<boolean> {
    const path = new URL(page.url()).pathname;
    return path === "/student/dashboard";
  }

  /**
   * Check if this is the admin dashboard
   */
  static async isAdminDashboard(page: Page): Promise<boolean> {
    const path = new URL(page.url()).pathname;
    return path === "/admin/access";
  }

  /**
   * Check if user is authenticated (not on login page)
   */
  static async isAuthenticated(page: Page): Promise<boolean> {
    const path = new URL(page.url()).pathname;
    return path !== "/login" && !path.includes("/auth");
  }

  /**
   * Get dashboard title (for verification)
   */
  static async getTitle(page: Page): Promise<string> {
    const h1 = page.locator("h1").first();
    return (await h1.textContent()) ?? "";
  }
}
