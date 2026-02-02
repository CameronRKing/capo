/**
 * E2E-01: Authentication & Access Request Flow (Browser Mode)
 *
 * True end-to-end test that runs in a real browser using Vitest browser mode.
 * Tests the access request form by navigating directly to the /request-access route.
 *
 * Prerequisites:
 * - Dev server must be running: `npm run dev`
 * - Convex backend must be available
 *
 * Run with: `npm run test:e2e`
 */

import React from "react";
import { test, expect } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ConvexProvider } from "convex/react";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../../src/router";
import { createTestConvexClient } from "./test-utils";

/**
 * Helper: Render the full app with router and navigate to request-access
 */
async function renderAndNavigateToRequestAccess() {
  const client = createTestConvexClient();

  const rendered = render(
    <ConvexProvider client={client}>
      <RouterProvider router={router} />
    </ConvexProvider>
  );

  // Navigate to /request-access directly
  router.navigate({ to: "/request-access" });

  // Wait for the page to load
  await waitFor(
    () => {
      expect(screen.getByText("Request Access")).toBeVisible();
    },
    { timeout: 5000 }
  );

  return rendered;
}

/**
 * Test 1: Access request form renders correctly
 *
 * Verifies that the form displays properly
 */
test("E2E-01: Access request form renders correctly", async () => {
  await renderAndNavigateToRequestAccess();

  // Verify heading
  expect(screen.getByText("Request Access")).toBeVisible();

  // Verify form fields exist
  expect(screen.getByLabelText(/full name/i)).toBeVisible();
  expect(screen.getByLabelText(/email address/i)).toBeVisible();

  // Verify role selection options
  expect(screen.getByLabelText(/teacher/i)).toBeVisible();
  expect(screen.getByLabelText(/student/i)).toBeVisible();

  // Verify submit button
  expect(screen.getByRole("button", { name: /submit request/i })).toBeVisible();
});

/**
 * Test 2: Form validation shows errors for empty fields
 */
test("E2E-01: Form validation shows errors for empty fields", async () => {
  await renderAndNavigateToRequestAccess();

  // Try to submit without filling form
  const submitButton = screen.getByRole("button", { name: /submit request/i });
  submitButton.click();

  // Should show validation errors
  expect(screen.getByText("Name is required")).toBeVisible();
  expect(screen.getByText("Email is required")).toBeVisible();
  expect(screen.getByText("Please select your role")).toBeVisible();
});

/**
 * Test 3: Form validates email format
 */
test("E2E-01: Form validates email format", async () => {
  await renderAndNavigateToRequestAccess();

  // Fill name
  const nameInput = screen.getByLabelText(/full name/i);
  fireEvent.change(nameInput, { target: { value: "Test User" } });

  // Fill invalid email
  const emailInput = screen.getByLabelText(/email address/i);
  fireEvent.change(emailInput, { target: { value: "invalid-email" } });

  // Select role
  const studentRadio = screen.getByLabelText(/student/i);
  studentRadio.click();

  // Try to submit
  const submitButton = screen.getByRole("button", { name: /submit request/i });
  submitButton.click();

  // Should show email validation error
  expect(screen.getByText("Please enter a valid email address")).toBeVisible();
});

/**
 * Test 4: Form submission shows loading state
 */
test("E2E-01: Form submission shows loading state", async () => {
  await renderAndNavigateToRequestAccess();

  // Fill form with valid data
  const nameInput = screen.getByLabelText(/full name/i);
  fireEvent.change(nameInput, { target: { value: "Alice Student" } });

  const emailInput = screen.getByLabelText(/email address/i);
  fireEvent.change(emailInput, { target: { value: "alice@student.com" } });

  const studentRadio = screen.getByLabelText(/student/i);
  studentRadio.click();

  // Submit form
  const submitButton = screen.getByRole("button", { name: /submit request/i });
  submitButton.click();

  // Should show loading state (button text changes to "Submitting...")
  await waitFor(
    () => {
      expect(screen.getByText(/submitting/i)).toBeVisible();
    },
    { timeout: 5000 }
  );
});

/**
 * Test 5: Role selection highlights correctly
 */
test("E2E-01: Role selection highlights correctly", async () => {
  await renderAndNavigateToRequestAccess();

  // Select teacher role
  const teacherRadio = screen.getByLabelText(/teacher/i);
  teacherRadio.click();

  // Verify visual feedback - the radio button should be checked
  expect(teacherRadio).toBeChecked();

  // Select student role
  const studentRadio = screen.getByLabelText(/student/i);
  studentRadio.click();

  // Verify student is now checked and teacher is not
  expect(studentRadio).toBeChecked();
  expect(teacherRadio).not.toBeChecked();
});

/**
 * Test 6: Form clears errors when user starts typing
 */
test("E2E-01: Form clears errors when user starts typing", async () => {
  await renderAndNavigateToRequestAccess();

  // Try to submit without filling form
  const submitButton = screen.getByRole("button", { name: /submit request/i });
  submitButton.click();

  // Should show errors
  expect(screen.getByText("Name is required")).toBeVisible();

  // Start typing in name field
  const nameInput = screen.getByLabelText(/full name/i);
  fireEvent.change(nameInput, { target: { value: "Test" } });

  // Name error should clear
  expect(screen.queryByText("Name is required")).not.toBeInTheDocument();
});
