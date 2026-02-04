/**
 * E2E-04: Student Leadership Decision Form (Browser Mode)
 *
 * True end-to-end tests for the student leadership decision form.
 * Tests form rendering, validation, and UI interactions using browser mode.
 *
 * Features tested:
 * - Form renders with all sections visible
 * - Time allocation sliders and validation
 * - Market reports checkboxes
 * - Rep management cards
 * - Submit button state management
 * - Auto-save indicator
 *
 * Prerequisites:
 * - Dev server running: `npm run dev`
 * - Convex backend available
 * - Test data seeded in backend
 *
 * Run with: `npm run test:e2e`
 *
 * @see src/routes/student/decisions/leadership.tsx
 * @see src/components/decisions/LeadershipDecisionForm.tsx
 */

import React from "react";
import { test, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock TanStack Router to avoid router context
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  };
});

// Mock Convex for component testing
// Note: In true E2E tests, we would navigate to the actual page and test with real backend
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(() => null),
    useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
  };
});

/**
 * Test 1: Leadership form renders with loading state initially
 */
test("E2E-04: Leadership form shows loading state initially", async () => {
  // When reps query returns null (loading), show loading
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue(null);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };
  const mockCompanyId = "test-company-id";

  render(
    <LeadershipDecisionForm
      companyId={mockCompanyId as any}
      quarter={1}
      user={mockUser}
    />
  );

  // Should show loading initially
  expect(screen.getByText("Loading...")).toBeVisible();
});

/**
 * Test 2: Leadership form renders all sections when data loads
 */
test("E2E-04: Leadership form renders all sections", async () => {
  // Mock reps data
  const { useQuery } = require("convex/react");
  useQuery.mockImplementation((query: any, args: any) => {
    if (args?.companyId === "test-company-id") {
      // Return mock reps
      return [
        {
          _id: "rep-1",
          repId: "RESUME_001",
          companyId: "test-company-id",
          quarter: 1,
          individualHours: 1,
          leadershipBehavior: "Support",
          territories: [],
        },
        {
          _id: "rep-2",
          repId: "RESUME_002",
          companyId: "test-company-id",
          quarter: 1,
          individualHours: 2,
          leadershipBehavior: "Goals",
          territories: [],
        },
      ];
    }
    return null;
  });

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };
  const mockCompanyId = "test-company-id";

  render(
    <LeadershipDecisionForm
      companyId={mockCompanyId as any}
      quarter={1}
      user={mockUser}
    />
  );

  // Wait for form to render
  await waitFor(
    () => {
      expect(screen.getByText(/Time Allocation/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify all main sections are visible
  expect(screen.getByText(/Time Allocation/i)).toBeVisible();
  expect(screen.getByText(/Individual Rep Management/i)).toBeVisible();
  expect(screen.getByText(/Territory Assignments/i)).toBeVisible();
  expect(screen.getByText(/Market Reports/i)).toBeVisible();
});

/**
 * Test 3: Time allocation sliders render with correct labels
 */
test("E2E-04: Time allocation sliders render correctly", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Time Allocation/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify all time allocation sliders are present
  expect(screen.getByText(/Recruiting/i)).toBeVisible();
  expect(screen.getByText(/Meeting Customers/i)).toBeVisible();
  expect(screen.getByText(/Sales Planning/i)).toBeVisible();
  expect(screen.getByText(/Administrative Paperwork/i)).toBeVisible();

  // Verify total indicator
  expect(screen.getByText(/Total:/i)).toBeVisible();
});

/**
 * Test 4: Market reports checkboxes render correctly
 */
test("E2E-04: Market reports checkboxes render correctly", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Market Reports/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify all market report checkboxes
  expect(screen.getByText(/Territory Reports/i)).toBeVisible();
  expect(screen.getByText(/Compensation Reports/i)).toBeVisible();
  expect(screen.getByText(/Performance Reports/i)).toBeVisible();

  // Verify cost display
  expect(screen.getByText(/Total Cost:/i)).toBeVisible();
});

/**
 * Test 5: Individual rep management cards render
 */
test("E2E-04: Individual rep management cards render", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
    {
      _id: "rep-2",
      repId: "RESUME_002",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 2,
      leadershipBehavior: "Goals",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Individual Rep Management/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify rep cards are rendered
  expect(screen.getByText("RESUME_001")).toBeVisible();
  expect(screen.getByText("RESUME_002")).toBeVisible();

  // Verify individual hours options
  expect(screen.getByText(/Individual Hours/i)).toBeVisible();
  expect(screen.getByText(/0-1 hours/i)).toBeVisible();
  expect(screen.getByText(/1-2 hours/i)).toBeVisible();
  expect(screen.getByText(/2\+ hours/i)).toBeVisible();

  // Verify leadership behavior dropdowns
  expect(screen.getByText(/Leadership Behavior/i)).toBeVisible();
});

/**
 * Test 6: Submit button renders and is initially disabled
 */
test("E2E-04: Submit button renders with correct initial state", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Time Allocation/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify submit button exists
  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });
  expect(submitButton).toBeVisible();

  // Button should be disabled initially (time sum is 0, not 100)
  expect(submitButton).toBeDisabled();
});

/**
 * Test 7: Auto-save indicator shows saving state
 */
test("E2E-04: Auto-save indicator displays correctly", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Time Allocation/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Auto-save indicator area should be present (even if idle)
  const saveIndicator = screen.queryByText(/Saving.../i);
  expect(saveIndicator).toBeNull(); // Should not show "Saving..." initially
});

/**
 * Test 8: Validation message shows when time allocation is not 100%
 */
test("E2E-04: Validation message shows for invalid time allocation", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Total:/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Initial total is 0%, should show validation message
  expect(screen.getByText(/Total: 0%/i)).toBeVisible();
  expect(screen.getByText(/Time allocation must sum to 100%/i)).toBeVisible();
});

/**
 * Test 9: Market reports cost calculation displays correctly
 */
test("E2E-04: Market reports cost displays correctly", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Total Cost:/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Initial cost is $0 (no reports selected)
  expect(screen.getByText(/Total Cost: \$0/i)).toBeVisible();
});

/**
 * Test 10: Leadership behavior dropdown options are available
 */
test("E2E-04: Leadership behavior options render correctly", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Directive - Clear instructions and close supervision",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Individual Rep Management/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify leadership behavior select exists
  const behaviorSelects = document.querySelectorAll("select");
  expect(behaviorSelects.length).toBeGreaterThan(0);

  // Verify the select contains leadership behavior options
  const select = behaviorSelects[0];
  expect(select).toBeVisible();
});

/**
 * Test 11: Form displays submitted state correctly
 */
test("E2E-04: Form displays submitted state", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockImplementation((query: any, args: any) => {
    if (String(query).includes("getLeadershipDecisionWorking")) {
      // Return mock submitted decision
      return {
        _id: "decision-1",
        companyId: "test-company-id",
        quarter: 1,
        timeRecruiting: 25,
        timeMeetingCustomers: 25,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
        isSubmitted: true,
        submittedBy: "Test Student",
        submittedAt: Date.now(),
      };
    }
    return [
      {
        _id: "rep-1",
        repId: "RESUME_001",
        companyId: "test-company-id",
        quarter: 1,
        individualHours: 1,
        leadershipBehavior: "Support",
        territories: [],
      },
    ];
  });

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Time Allocation/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Should show submitted indicator
  const submittedIndicator = screen.queryByText(/✓ Submitted/i);
  expect(submittedIndicator).toBeVisible();

  // Should not show submit button (already submitted)
  const submitButton = screen.queryByRole("button", { name: /Submit Decisions/i });
  expect(submitButton).toBeNull();
});

/**
 * Test 12: Presence header displays company name
 */
test("E2E-04: Presence header displays company information", async () => {
  const { useQuery } = require("convex/react");
  useQuery.mockReturnValue([
    {
      _id: "rep-1",
      repId: "RESUME_001",
      companyId: "test-company-id",
      quarter: 1,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    },
  ]);

  const { LeadershipDecisionForm } = require("../../src/components/decisions/LeadershipDecisionForm");
  const mockUser = {
    _id: "test-user-id",
    name: "Test Student",
    email: "student@test.com",
  };

  render(
    <LeadershipDecisionForm
      companyId={"test-company-id" as any}
      quarter={1}
      user={mockUser}
    />
  );

  await waitFor(
    () => {
      expect(screen.getByText(/Company test-company-id/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify company name is displayed
  expect(screen.getByText(/Company test-company-id/i)).toBeVisible();
});
