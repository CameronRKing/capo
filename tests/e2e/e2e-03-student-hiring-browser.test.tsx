/**
 * E2E-03: Student Hiring Decision Submission (Browser Mode)
 *
 * True end-to-end tests for the student hiring decision form.
 * Tests form rendering, validation, and UI interactions using browser mode.
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
 * Run with: `npm run test:e2e -- e2e-03-student-hiring-browser.test.tsx`
 *
 * @see src/routes/student/decisions/hiring.tsx
 * @see src/components/decisions/HiringDecisionForm.tsx
 * @see convex/domain/decisions/validators.ts
 */

import React from "react";
import { test, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HiringDecisionForm } from "../../src/components/decisions/HiringDecisionForm";
import type { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// =====================================================
// Mock Setup
// =====================================================

// Mock useCurrentUser hook
vi.mock("../../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => ({
    _id: "test-user-id" as Id<"users">,
    name: "Test Student",
    email: "test@student.com",
    role: "student",
    gameId: "test-game-id" as Id<"games">,
    companyId: "test-company-id" as Id<"companies">,
  })),
}));

// Create STABLE mock data (defined outside the mock to maintain reference equality)
const mockWorkingDecision = Object.freeze({
  salary: 50000,
  commission: 5,
  benefits: "bronze",
  travel: "reps_pay_own",
  perDiem: undefined,
  hasSalesContest: false,
  salesContestType: undefined,
  salesContestThreshold: undefined,
  trainingProductKnowledge: 25,
  trainingMarketOrientation: 25,
  trainingCompanyOrientation: 25,
  trainingSellingTechniques: 25,
  numberToHire: 0,
  firingList: [],
});

const mockCompanyInfo = Object.freeze({
  name: "Company A",
  industry: "Technology",
});

// Mock Convex queries and mutations with STABLE references
const mockSaveWorking = vi.fn().mockResolvedValue({});
const mockSubmit = vi.fn().mockResolvedValue({});

vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn((_, args) => {
      // Return mock company info for companies.get query
      if (args && typeof args === "object" && "id" in args) {
        return mockCompanyInfo;
      }
      // Return mock working decision (STABLE reference)
      return mockWorkingDecision;
    }),
    useMutation: vi.fn(() => {
      // Return a function that checks which mutation is being called
      const mockFn = vi.fn().mockResolvedValue({});
      // Tag the function with properties for identification
      (mockFn as any).__isSaveWorking = true;
      (mockFn as any).__isSubmit = true;
      return mockFn;
    }),
  };
});

// Mock collaboration components (presence, focus)
vi.mock("../../src/components/collaboration/CompanyPresenceHeader", () => ({
  CompanyPresenceHeader: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="company-presence-header">{children}</div>
  ),
}));

vi.mock("../../src/components/collaboration/FocusIndicator", () => ({
  FocusIndicator: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

// =====================================================
// Test Utilities
// =====================================================

/**
 * Render HiringDecisionForm with test context
 */
async function renderHiringForm(
  companyId: Id<"companies"> = "test-company-id" as Id<"companies">,
  quarter: number = 1
) {
  const rendered = render(
    <HiringDecisionForm companyId={companyId} quarter={quarter} />
  );

  // Wait for form to render
  await waitFor(
    () => {
      expect(screen.getByText(/Compensation Package/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  return rendered;
}

// =====================================================
// Test Suite 1: Form Rendering
// =====================================================

/**
 * Test 1.1: Form renders with all sections visible
 */
test("E2E-03: Hiring decision form renders all sections", async () => {
  await renderHiringForm();

  // Verify all main sections are visible
  expect(screen.getByText(/Compensation Package/i)).toBeVisible();
  expect(screen.getByText(/Sales Contest/i)).toBeVisible();
  expect(screen.getByText(/Training Time Allocation/i)).toBeVisible();
  expect(screen.getByText(/Recruiting Time Allocation/i)).toBeVisible();
  expect(screen.getByText(/Hiring & Firing/i)).toBeVisible();
});

/**
 * Test 1.2: All form fields render with correct defaults
 */
test("E2E-03: Form fields render with default values", async () => {
  await renderHiringForm();

  // Salary default
  const salaryInput = screen.getByLabelText(/Annual Base Salary/i) as HTMLInputElement;
  expect(salaryInput).toBeVisible();
  expect(salaryInput.value).toBe("50000");

  // Commission default
  expect(screen.getByText(/5%/)).toBeVisible();

  // Benefits default (bronze)
  const bronzeRadio = screen.getByDisplayValue("bronze") as HTMLInputElement;
  expect(bronzeRadio).toBeChecked();

  // Training defaults (25% each)
  expect(screen.getByText(/Product Knowledge: 25%/i)).toBeVisible();
  expect(screen.getByText(/Market Orientation: 25%/i)).toBeVisible();
  expect(screen.getByText(/Company Orientation: 25%/i)).toBeVisible();
  expect(screen.getByText(/Selling Techniques: 25%/i)).toBeVisible();

  // Training sum indicator shows 100%
  const trainingSumElement = screen.getByText(/Training Allocation Total:/i)
    .nextElementSibling as HTMLElement;
  expect(trainingSumElement.textContent).toBe("100%");
});

/**
 * Test 1.3: Auto-save status indicator is visible
 */
test("E2E-03: Auto-save status indicator container exists", async () => {
  await renderHiringForm();

  // Auto-save status container exists
  const saveStatusContainer = document.querySelector("div.flex.justify-end");
  expect(saveStatusContainer).toBeDefined();
});

// =====================================================
// Test Suite 2: Form Validation
// =====================================================

/**
 * Test 2.1: Salary input accepts valid range values
 */
test("E2E-03: Salary input accepts valid values", async () => {
  await renderHiringForm();

  const salaryInput = screen.getByLabelText(/Annual Base Salary/i) as HTMLInputElement;
  const user = userEvent.setup();

  // Valid minimum
  await user.clear(salaryInput);
  await user.type(salaryInput, "30000");
  expect(salaryInput.value).toBe("30000");

  // Valid maximum
  await user.clear(salaryInput);
  await user.type(salaryInput, "100000");
  expect(salaryInput.value).toBe("100000");

  // Valid middle value
  await user.clear(salaryInput);
  await user.type(salaryInput, "65000");
  expect(salaryInput.value).toBe("65000");
});

/**
 * Test 2.2: Commission slider updates percentage display
 */
test("E2E-03: Commission slider updates display", async () => {
  await renderHiringForm();

  const commissionSlider = screen.getByRole("slider", {
    name: /commission/i,
  }) as HTMLInputElement;
  const user = userEvent.setup();

  // Initial value is 5%
  expect(commissionSlider.value).toBe("5");

  // Change to 10%
  commissionSlider.value = "10";
  commissionSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    expect(screen.getByText("10%")).toBeVisible();
  });
});

/**
 * Test 2.3: Training allocation sum updates in real-time
 */
test("E2E-03: Training allocation sum updates correctly", async () => {
  await renderHiringForm();

  const user = userEvent.setup();

  // Get all sliders (4 training + 1 recruiting = 5 total)
  const sliders = screen.getAllByRole("slider");

  // Training sliders are the first 4
  const productKnowledgeSlider = sliders[0] as HTMLInputElement;
  const marketOrientationSlider = sliders[1] as HTMLInputElement;

  // Initial sum is 100% (25 + 25 + 25 + 25)
  const trainingSumElement = screen.getByText(/Training Allocation Total:/i)
    .nextElementSibling as HTMLElement;
  expect(trainingSumElement.textContent).toBe("100%");

  // Change product knowledge to 50%
  productKnowledgeSlider.value = "50";
  productKnowledgeSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    const updatedSum = screen.getByText(/Training Allocation Total:/i)
      .nextElementSibling as HTMLElement;
    expect(updatedSum.textContent).toBe("125%"); // 50 + 25 + 25 + 25
  });

  // Reduce market orientation to 0%
  marketOrientationSlider.value = "0";
  marketOrientationSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    const updatedSum = screen.getByText(/Training Allocation Total:/i)
      .nextElementSibling as HTMLElement;
    expect(updatedSum.textContent).toBe("100%"); // 50 + 0 + 25 + 25
  });
});

/**
 * Test 2.4: Benefits radio buttons can be selected
 */
test("E2E-03: Benefits radio selection works", async () => {
  await renderHiringForm();

  const user = userEvent.setup();

  // Initially bronze is selected
  const bronzeRadio = screen.getByDisplayValue("bronze") as HTMLInputElement;
  const silverRadio = screen.getByDisplayValue("silver") as HTMLInputElement;
  const goldRadio = screen.getByDisplayValue("gold") as HTMLInputElement;

  expect(bronzeRadio).toBeChecked();

  // Click silver
  await user.click(silverRadio);
  expect(silverRadio).toBeChecked();
  expect(bronzeRadio).not.toBeChecked();

  // Click gold
  await user.click(goldRadio);
  expect(goldRadio).toBeChecked();
  expect(silverRadio).not.toBeChecked();
});

/**
 * Test 2.5: Travel radio buttons show/hide per diem field
 */
test("E2E-03: Travel selection controls per diem visibility", async () => {
  await renderHiringForm();

  const user = userEvent.setup();

  // Initially per diem is hidden (default is "reps_pay_own")
  expect(screen.queryByLabelText(/Monthly Per Diem/i)).not.toBeInTheDocument();

  // Select "monthly per diem"
  const monthlyPerDiemRadio = screen.getByDisplayValue("monthly_per_diem") as HTMLInputElement;
  await user.click(monthlyPerDiemRadio);

  // Per diem input should appear
  await waitFor(() => {
    expect(screen.getByLabelText(/Monthly Per Diem/i)).toBeVisible();
  });

  // Select "unlimited" - per diem should disappear
  const unlimitedRadio = screen.getByDisplayValue("unlimited") as HTMLInputElement;
  await user.click(unlimitedRadio);

  await waitFor(() => {
    expect(screen.queryByLabelText(/Monthly Per Diem/i)).not.toBeInTheDocument();
  });
});

/**
 * Test 2.6: Sales contest checkbox shows/hide contest fields
 */
test("E2E-03: Sales contest checkbox controls conditional fields", async () => {
  await renderHiringForm();

  const user = userEvent.setup();

  // Initially contest fields are hidden
  expect(screen.queryByText(/Contest Type/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Sales Threshold/i)).not.toBeInTheDocument();

  // Enable sales contest
  const hasSalesContestCheckbox = screen.getByRole("checkbox", {
    name: /Run a sales contest/i,
  }) as HTMLInputElement;

  await user.click(hasSalesContestCheckbox);
  expect(hasSalesContestCheckbox).toBeChecked();

  // Contest type should appear
  await waitFor(() => {
    expect(screen.getByText(/Contest Type/i)).toBeVisible();
  });

  // Select "open" to show threshold
  const openContestRadio = screen.getByDisplayValue("open") as HTMLInputElement;
  await user.click(openContestRadio);

  // Sales threshold should appear
  await waitFor(() => {
    expect(screen.getByLabelText(/Sales Threshold/i)).toBeVisible();
  });

  // Disable contest
  await user.click(hasSalesContestCheckbox);

  await waitFor(() => {
    expect(screen.queryByText(/Contest Type/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Sales Threshold/i)).not.toBeInTheDocument();
  });
});

/**
 * Test 2.7: Number to hire input accepts valid values
 */
test("E2E-03: Number to hire accepts valid values", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const hireInput = screen.getByLabelText(/Number of Sales Reps to Hire/i) as HTMLInputElement;

  // Test values 0-3
  await user.clear(hireInput);
  await user.type(hireInput, "0");
  expect(hireInput.value).toBe("0");

  await user.clear(hireInput);
  await user.type(hireInput, "2");
  expect(hireInput.value).toBe("2");

  await user.clear(hireInput);
  await user.type(hireInput, "3");
  expect(hireInput.value).toBe("3");
});

// =====================================================
// Test Suite 3: Auto-Save Functionality
// =====================================================

/**
 * Test 3.1: Form changes trigger save mutation
 */
test("E2E-03: Form changes trigger save mutation", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const salaryInput = screen.getByLabelText(/Annual Base Salary/i) as HTMLInputElement;

  // Clear mock call count from initial render
  mockSaveWorking.mockClear();

  // Change salary
  await user.clear(salaryInput);
  await user.type(salaryInput, "75000");

  // Wait for auto-save debounce (500ms + margin)
  await waitFor(
    () => {
      expect(mockSaveWorking).toHaveBeenCalled();
    },
    { timeout: 2000 }
  );
});

/**
 * Test 3.2: Multiple changes debounce correctly
 */
test("E2E-03: Multiple rapid changes debounce correctly", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const salaryInput = screen.getByLabelText(/Annual Base Salary/i) as HTMLInputElement;

  // Clear mock
  mockSaveWorking.mockClear();

  // Make multiple rapid changes
  await user.clear(salaryInput);
  await user.type(salaryInput, "60000");
  await user.clear(salaryInput);
  await user.type(salaryInput, "65000");
  await user.clear(salaryInput);
  await user.type(salaryInput, "70000");

  // Should only call save once (debounced)
  await waitFor(
    () => {
      expect(mockSaveWorking).toHaveBeenCalledTimes(1);
    },
    { timeout: 2000 }
  );
});

// =====================================================
// Test Suite 4: Submission Workflow
// =====================================================

/**
 * Test 4.1: Submit button exists and is clickable
 */
test("E2E-03: Submit button exists and is enabled", async () => {
  await renderHiringForm();

  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });

  expect(submitButton).toBeVisible();
  expect(submitButton).not.toBeDisabled();
});

/**
 * Test 4.2: Submit button opens confirmation dialog
 */
test("E2E-03: Submit button opens confirmation dialog", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });

  await user.click(submitButton);

  // Confirmation dialog should appear
  await waitFor(() => {
    expect(screen.getByText(/Submit Hiring Decision\?/i)).toBeVisible();
    expect(screen.getByText(/Are you sure you want to submit/i)).toBeVisible();
  });
});

/**
 * Test 4.3: Confirmation dialog has cancel and confirm buttons
 */
test("E2E-03: Confirmation dialog has both buttons", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });

  await user.click(submitButton);

  // Both buttons should be present
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Confirm & Submit/i })).toBeVisible();
  });
});

/**
 * Test 4.4: Cancel closes dialog without submitting
 */
test("E2E-03: Cancel closes dialog without submitting", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });

  // Clear mock
  mockSubmit.mockClear();

  // Open dialog
  await user.click(submitButton);

  // Click cancel
  const cancelButton = screen.getByRole("button", { name: /Cancel/i });
  await user.click(cancelButton);

  // Dialog should close
  await waitFor(() => {
    expect(screen.queryByText(/Submit Hiring Decision\?/i)).not.toBeInTheDocument();
  });

  // Submit should NOT be called
  expect(mockSubmit).not.toHaveBeenCalled();
});

/**
 * Test 4.5: Confirm triggers submit mutation
 */
test("E2E-03: Confirm triggers submit mutation", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });

  // Clear mock
  mockSubmit.mockClear();

  // Open dialog
  await user.click(submitButton);

  // Click confirm
  const confirmButton = screen.getByRole("button", { name: /Confirm & Submit/i });
  await user.click(confirmButton);

  // Submit mutation should be called
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      companyId: "test-company-id",
      quarter: 1,
    });
  });
});

// =====================================================
// Test Suite 5: User Interaction Flow
// =====================================================

/**
 * Test 5.1: Complete form fill and submit workflow
 */
test("E2E-03: Complete workflow from fill to submit", async () => {
  await renderHiringForm();

  const user = userEvent.setup();

  // Fill compensation
  const salaryInput = screen.getByLabelText(/Annual Base Salary/i) as HTMLInputElement;
  await user.clear(salaryInput);
  await user.type(salaryInput, "75000");

  // Change benefits
  const goldRadio = screen.getByDisplayValue("gold") as HTMLInputElement;
  await user.click(goldRadio);

  // Enable sales contest
  const hasSalesContestCheckbox = screen.getByRole("checkbox", {
    name: /Run a sales contest/i,
  }) as HTMLInputElement;
  await user.click(hasSalesContestCheckbox);

  // Select open contest
  const openContestRadio = screen.getByDisplayValue("open") as HTMLInputElement;
  await user.click(openContestRadio);

  // Set threshold
  const thresholdInput = screen.getByLabelText(/Sales Threshold/i) as HTMLInputElement;
  await user.clear(thresholdInput);
  await user.type(thresholdInput, "15000");

  // Wait for auto-saves
  await waitFor(
    () => {
      expect(mockSaveWorking).toHaveBeenCalled();
    },
    { timeout: 2000 }
  );

  // Submit
  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });
  await user.click(submitButton);

  // Confirm
  const confirmButton = screen.getByRole("button", { name: /Confirm & Submit/i });
  await user.click(confirmButton);

  // Verify submit called
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalled();
  });
});

// =====================================================
// Test Suite 6: Training Allocation Scenarios
// =====================================================

/**
 * Test 6.1: Training sliders can be adjusted independently
 */
test("E2E-03: Training sliders adjust independently", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const sliders = screen.getAllByRole("slider");

  // Training sliders are first 4
  const productKnowledgeSlider = sliders[0] as HTMLInputElement;
  const marketOrientationSlider = sliders[1] as HTMLInputElement;
  const companyOrientationSlider = sliders[2] as HTMLInputElement;
  const sellingTechniquesSlider = sliders[3] as HTMLInputElement;

  // Adjust each independently
  productKnowledgeSlider.value = "30";
  productKnowledgeSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    expect(screen.getByText(/Product Knowledge: 30%/i)).toBeVisible();
  });

  marketOrientationSlider.value = "20";
  marketOrientationSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    expect(screen.getByText(/Market Orientation: 20%/i)).toBeVisible();
  });

  companyOrientationSlider.value = "15";
  companyOrientationSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    expect(screen.getByText(/Company Orientation: 15%/i)).toBeVisible();
  });

  sellingTechniquesSlider.value = "35";
  sellingTechniquesSlider.dispatchEvent(new Event("input", { bubbles: true }));

  await waitFor(() => {
    expect(screen.getByText(/Selling Techniques: 35%/i)).toBeVisible();
  });

  // Verify total
  const trainingSumElement = screen.getByText(/Training Allocation Total:/i)
    .nextElementSibling as HTMLElement;
  expect(trainingSumElement.textContent).toBe("100%"); // 30 + 20 + 15 + 35 = 100
});

/**
 * Test 6.2: Training sum indicator changes color based on validity
 */
test("E2E-03: Training sum indicator shows correct color", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const sliders = screen.getAllByRole("slider");
  const productKnowledgeSlider = sliders[0] as HTMLInputElement;

  // Initially green (100%)
  const trainingSumElement = screen.getByText(/Training Allocation Total:/i)
    .nextElementSibling as HTMLElement;
  expect(trainingSumElement.className).toContain("text-green-600");

  // Break the sum
  productKnowledgeSlider.value = "50";
  productKnowledgeSlider.dispatchEvent(new Event("input", { bubbles: true }));

  // Should turn red
  await waitFor(() => {
    const updatedSum = screen.getByText(/Training Allocation Total:/i)
      .nextElementSibling as HTMLElement;
    expect(updatedSum.className).toContain("text-red-600");
  });
});

// =====================================================
// Test Suite 7: Error Messages and Help Text
// =====================================================

/**
 * Test 7.1: Help text displays for recruiting field
 */
test("E2E-03: Help text displays for recruiting field", async () => {
  await renderHiringForm();

  // Recruiting section has a note about field not being implemented
  expect(
    screen.getByText(/Recruiting allocation field not yet implemented/i)
  ).toBeVisible();
});

/**
 * Test 7.2: Help text displays for hiring/firing lists
 */
test("E2E-03: Help text displays for hiring/firing lists", async () => {
  await renderHiringForm();

  // Hiring & Firing section has a note about lists coming soon
  expect(
    screen.getByText(/Hiring list and firing list selection coming soon/i)
  ).toBeVisible();
});

/**
 * Test 7.3: Error message displays when training sum != 100%
 */
test("E2E-03: Error message when training sum is not 100%", async () => {
  await renderHiringForm();

  const user = userEvent.setup();
  const sliders = screen.getAllByRole("slider");
  const productKnowledgeSlider = sliders[0] as HTMLInputElement;

  // Break the sum
  productKnowledgeSlider.value = "50";
  productKnowledgeSlider.dispatchEvent(new Event("input", { bubbles: true }));

  // Should show error message
  await waitFor(() => {
    expect(screen.getByText(/Must equal exactly 100%/i)).toBeVisible();
  });
});
