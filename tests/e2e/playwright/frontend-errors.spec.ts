import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Frontend Errors
 *
 * These tests expose known frontend bugs that need to be fixed:
 * 1. ErrorPage import errors causing crashes
 * 2. Convex getPhaseStatus server errors
 * 3. Double routing paths (/student//student/)
 */

test.describe("Frontend Error Detection", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate as student user
    await page.goto("/?user=student@test.com");
    await page.waitForTimeout(2000); // Wait for initial load
  });

  test("should not have ErrorPage import errors in console", async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate to student dashboard
    await page.waitForTimeout(3000);

    // Check for ErrorPage is not defined errors
    const errorPageErrors = errors.filter((e) =>
      e.includes("ErrorPage is not defined")
    );

    expect(
      errorPageErrors.length,
      `Should not have ErrorPage import errors. Found: ${errorPageErrors.join(", ")}`
    ).toBe(0);
  });

  test("should not have Convex getPhaseStatus server errors", async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate to student dashboard
    await page.waitForTimeout(3000);

    // Check for getPhaseStatus Convex errors
    const phaseStatusErrors = errors.filter((e) =>
      e.includes("getPhaseStatus") && e.includes("Server Error")
    );

    expect(
      phaseStatusErrors.length,
      `Should not have getPhaseStatus server errors. Found: ${phaseStatusErrors.join(", ")}`
    ).toBe(0);
  });

  test("should not have double routing paths", async ({ page }) => {
    // Wait for navigation to complete
    await page.waitForTimeout(2000);

    const url = page.url();
    console.log("Current URL:", url);

    // Check for double path like /student//student/
    const hasDoublePath = url.includes("//student");

    expect(
      hasDoublePath,
      `Should not have double path in URL. Current URL: ${url}`
    ).toBe(false);
  });

  test("student dashboard should load without crashing", async ({ page }) => {
    const errors: string[] = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait for page to load
    await page.waitForTimeout(5000);

    // Check that we're not on an error page
    const pageTitle = await page.title();
    const url = page.url();

    console.log("Page title:", pageTitle);
    console.log("Page URL:", url);
    console.log("Console errors:", errors);

    // Should be on student page
    expect(url, "Should be on student dashboard").toContain("/student");

    // Should not have "Error" in title (unless it's the actual page title)
    const isErrored =
      pageTitle.toLowerCase().includes("error") ||
      errors.some((e) =>
        e.includes("ErrorPage is not defined") ||
        e.includes("getPhaseStatus") ||
        e.includes("Server Error")
      );

    expect(isErrored, "Page should load without errors").toBe(false);

    // Page should have some content (not blank)
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length, "Page should have content").toBeGreaterThan(100);
  });

  test("should have all required imports in student index route", async ({
    page,
  }) => {
    // This test verifies the code has the ErrorPage import
    // by checking if the page crashes without it

    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(3000);

    // Filter for ReferenceError related to ErrorPage
    const referenceErrors = errors.filter((e) =>
      e.includes("ReferenceError") && e.includes("ErrorPage")
    );

    expect(
      referenceErrors.length,
      `Should not have ErrorPage reference errors. Found: ${referenceErrors.join(", ")}`
    ).toBe(0);
  });

  test("should display student navigation hub content", async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(3000);

    // Check for expected content on student dashboard
    const bodyText = await page.locator("body").innerText();
    console.log("Page content preview:", bodyText.substring(0, 200));

    // Should have navigation elements
    const hasNavigation = await page.locator("a[href*='/student']").count() > 0;

    expect(
      hasNavigation,
      "Should have navigation links present"
    ).toBeTruthy();
  });
});
