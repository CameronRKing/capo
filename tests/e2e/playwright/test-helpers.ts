/**
 * Helper utilities for Playwright E2E tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Login as a specific role using query param (for testing)
 *
 * Usage:
 *   await loginAs(page, 'student');
 *   await loginAs(page, 'teacher');
 *   await loginAs(page, 'admin');
 */
export async function loginAs(page: Page, role: 'student' | 'teacher' | 'admin') {
  await page.goto(`/?role=${role}`);
  // Wait for redirect/initialization
  await page.waitForTimeout(1000);
}

/**
 * Wait for Convex queries to resolve
 *
 * Checks for loading indicators and waits for them to disappear
 */
export async function waitForConvex(page: Page, timeout = 5000) {
  // Wait for common loading indicators
  const loaders = page.locator('[data-testid="loading"], .loading, [role="progressbar"]');

  const count = await loaders.count();
  if (count > 0) {
    await loaders.first().waitFor({ state: 'hidden', timeout });
  }

  // Additional wait for data to load
  await page.waitForTimeout(500);
}

/**
 * Fill a form field with error handling
 *
 * Usage:
 *   await safeFill(page, 'input[name="email"]', 'test@example.com');
 */
export async function safeFill(page: Page, selector: string, value: string) {
  const element = page.locator(selector);
  const count = await element.count();

  if (count === 0) {
    throw new Error(`Element not found: ${selector}`);
  }

  await element.first().fill(value);
}

/**
 * Click an element with error handling
 *
 * Usage:
 *   await safeClick(page, 'button[type="submit"]');
 */
export async function safeClick(page: Page, selector: string) {
  const element = page.locator(selector);
  const count = await element.count();

  if (count === 0) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Wait for element to be ready
  await element.first().waitFor({ state: 'visible' });
  await element.first().click();
}

/**
 * Wait for navigation to complete
 */
export async function waitForNavigation(page: Page, urlPattern?: string) {
  await page.waitForLoadState('networkidle');

  if (urlPattern) {
    expect(page.url()).toContain(urlPattern);
  }
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Get text content of element
 */
export async function getText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  await expect(element.first()).toBeVisible();
  return (await element.first().textContent()) || '';
}

/**
 * Wait for success message
 */
export async function waitForSuccess(page: Page, timeout = 5000) {
  const successSelectors = [
    'text=success',
    'text=submitted',
    'text=complete',
    'text=Thank',
    '[data-testid="success"]',
  ];

  for (const selector of successSelectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return;
    } catch {
      // Try next selector
      continue;
    }
  }

  throw new Error('No success message found');
}

/**
 * Wait for error message
 */
export async function waitForError(page: Page, timeout = 5000) {
  const errorSelectors = [
    'text=error',
    'text=failed',
    'text=required',
    'text=invalid',
    '[data-testid="error"]',
    '.error',
  ];

  for (const selector of errorSelectors) {
    try {
      await page.waitForSelector(selector, { timeout });
      return;
    } catch {
      // Try next selector
      continue;
    }
  }

  throw new Error('No error message found');
}

/**
 * Select option from dropdown with error handling
 */
export async function selectOption(page: Page, selector: string, value: string | { index: number }) {
  const element = page.locator(selector);
  const count = await element.count();

  if (count === 0) {
    throw new Error(`Element not found: ${selector}`);
  }

  const tagName = await element.first().evaluate(el => el.tagName);

  if (tagName === 'SELECT') {
    await element.first().selectOption(value);
  } else {
    // Custom dropdown - click and select
    await element.first().click();
    await page.waitForTimeout(500);

    if (typeof value === 'string') {
      await page.locator(`text=${value}`).click();
    } else {
      // Index-based selection
      const options = page.locator('[role="option"], .option');
      await options.nth(value.index).click();
    }
  }
}

/**
 * Take screenshot on failure
 */
export async function screenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({
    path: `screenshots/${testName}-failure.png`,
    fullPage: true,
  });
}

/**
 * Clear all input fields in a form
 */
export async function clearForm(page: Page, formSelector = 'form') {
  const form = page.locator(formSelector);
  const inputs = form.locator('input, textarea');

  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).fill('');
  }
}

/**
 * Mock authentication for testing
 *
 * Note: This requires backend support for test authentication
 */
export async function mockAuth(page: Page, userId: string, role: string) {
  await page.evaluate(
    ({ userId, role }) => {
      localStorage.setItem('testUserId', userId);
      localStorage.setItem('testRole', role);
    },
    { userId, role }
  );
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const hasLogoutButton = await page.locator('[data-testid="logout-button"]').count() > 0;
  const hasLoginInput = await page.locator('input[name="email"]').count() > 0;

  return hasLogoutButton && !hasLoginInput;
}

/**
 * Get current user role from URL or state
 */
export async function getCurrentRole(page: Page): Promise<string | null> {
  const url = page.url();
  const roleMatch = url.match(/[?&]role=(student|teacher|admin)/);

  if (roleMatch) {
    return roleMatch[1];
  }

  // Check localStorage
  const role = await page.evaluate(() => localStorage.getItem('testRole'));
  return role;
}

/**
 * Wait for element to be stable (not moving, not loading)
 */
export async function waitForStable(page: Page, selector: string, timeout = 5000) {
  const element = page.locator(selector);

  await element.first().waitFor({ state: 'attached', timeout });
  await element.first().waitFor({ state: 'visible', timeout });

  // Wait for animations to complete
  await page.waitForTimeout(300);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, i)));
      }
    }
  }

  throw lastError;
}

/**
 * Console log helper for debugging
 */
export async function debugLog(page: Page, message: string) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Get all console messages from page
 */
export async function getConsoleMessages(page: Page): Promise<string[]> {
  const messages: string[] = [];

  page.on('console', msg => {
    messages.push(msg.text());
  });

  return messages;
}

/**
 * Set up common page event listeners for debugging
 */
export function setupPageListeners(page: Page) {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Page console error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('Page error:', error);
  });

  page.on('requestfailed', request => {
    console.error('Request failed:', request.url(), request.failure());
  });
}
