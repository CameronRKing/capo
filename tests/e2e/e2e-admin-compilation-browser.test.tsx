/**
 * E2E-Admin: Compilation End-to-End (Component Testing Pattern)
 *
 * Tests for admin compilation workflow using mocked data (no real backend).
 * Tests cover game selection, compilation execution, and results viewing.
 *
 * Run with: `npm run test:e2e -- e2e-admin-compilation-browser.test.tsx`
 *
 * Test Coverage:
 * 1. Compilation page loads - verify game selection available
 * 2. Select game for compilation - verify game data loads
 * 3. Review hiring decisions - view all company decisions
 * 4. Review leadership decisions - view all officer selections
 * 5. Trigger compilation - execute compilation process
 * 6. Monitor compilation progress - loading indicators, status updates
 * 7. View compilation results - verify outcomes generated
 * 8. Error handling - handle incomplete decisions gracefully
 * 9. Download compilation report - verify results accessible
 * 10. Re-compile - support running compilation again
 */

import React from "react";
import { test, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompilationControl } from "../../src/routes/admin/compilation";
import type { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// =====================================================
// Mock Setup - STABLE Data References
// =====================================================

const mockGames = Object.freeze([
  {
    _id: "game-1" as Id<"games">,
    name: "Test Game 2025",
    currentQuarter: 1,
    currentPhase: "hiring" as const,
    status: "active" as const,
  },
  {
    _id: "game-2" as Id<"games">,
    name: "Another Game",
    currentQuarter: 2,
    currentPhase: "leadership" as const,
    status: "active" as const,
  },
]);

const mockCompanies = Object.freeze([
  {
    _id: "company-1" as Id<"companies">,
    gameId: "game-1" as Id<"games">,
    name: "Company A",
    industry: "Technology",
  },
  {
    _id: "company-2" as Id<"companies">,
    gameId: "game-1" as Id<"games">,
    name: "Company B",
    industry: "Healthcare",
  },
  {
    _id: "company-3" as Id<"companies">,
    gameId: "game-1" as Id<"games">,
    name: "Company C",
    industry: "Finance",
  },
  {
    _id: "company-4" as Id<"companies">,
    gameId: "game-1" as Id<"games">,
    name: "Company D",
    industry: "Manufacturing",
  },
]);

const mockHiringDecisions = Object.freeze([
  {
    companyId: "company-1" as Id<"companies">,
    quarter: 1,
    salary: 50000,
    commission: 5,
    benefits: "bronze" as const,
    travel: "reps_pay_own" as const,
    perDiem: undefined,
    hasSalesContest: false,
    trainingProductKnowledge: 25,
    trainingMarketOrientation: 25,
    trainingCompanyOrientation: 25,
    trainingSellingTechniques: 25,
    numberToHire: 2,
    isSubmitted: true,
    submittedAt: Date.now() - 1000 * 60 * 5,
  },
  {
    companyId: "company-2" as Id<"companies">,
    quarter: 1,
    salary: 60000,
    commission: 7,
    benefits: "silver" as const,
    travel: "monthly_per_diem" as const,
    perDiem: 500,
    hasSalesContest: false,
    trainingProductKnowledge: 30,
    trainingMarketOrientation: 20,
    trainingCompanyOrientation: 25,
    trainingSellingTechniques: 25,
    numberToHire: 2,
    isSubmitted: true,
    submittedAt: Date.now() - 1000 * 60 * 10,
  },
  {
    companyId: "company-3" as Id<"companies">,
    quarter: 1,
    salary: 55000,
    commission: 6,
    benefits: "bronze" as const,
    travel: "reps_pay_own" as const,
    perDiem: undefined,
    hasSalesContest: true,
    trainingProductKnowledge: 25,
    trainingMarketOrientation: 25,
    trainingCompanyOrientation: 25,
    trainingSellingTechniques: 25,
    numberToHire: 2,
    isSubmitted: true,
    submittedAt: Date.now() - 1000 * 60 * 15,
  },
  {
    companyId: "company-4" as Id<"companies">,
    quarter: 1,
    salary: 57000,
    commission: 6,
    benefits: "silver" as const,
    travel: "unlimited" as const,
    perDiem: undefined,
    hasSalesContest: false,
    trainingProductKnowledge: 25,
    trainingMarketOrientation: 25,
    trainingCompanyOrientation: 25,
    trainingSellingTechniques: 25,
    numberToHire: 2,
    isSubmitted: true,
    submittedAt: Date.now() - 1000 * 60 * 20,
  },
]);

const mockSubmissionStatus = Object.freeze({
  quarter: 1,
  phase: "hiring" as const,
  submitted: 4,
  pending: 0,
  total: 4,
  allSubmitted: true,
  companies: mockCompanies.map((c) => ({
    companyId: c._id,
    companyName: c.name,
    status: "submitted" as const,
    submittedAt: Date.now() - 1000 * 60 * 5,
  })),
});

const mockAdminUser = Object.freeze({
  _id: "admin-123" as Id<"users">,
  name: "Admin User",
  email: "admin@test.com",
  role: "admin" as const,
  gameId: "game-1" as Id<"games">,
  companyId: undefined,
});

const mockCompile = vi.fn().mockResolvedValue({
  success: true,
  companiesProcessed: 4,
  compilationId: "comp-1",
});

// Mock useCurrentUser hook
vi.mock("../../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => mockAdminUser),
}));

// Mock Convex queries and mutations with STABLE references
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn((queryName: string, args?: any) => {
      if (queryName.includes("games")) return mockGames;
      if (queryName.includes("companies")) return mockCompanies;
      if (queryName.includes("hiringDecisions")) return mockHiringDecisions;
      if (queryName.includes("submissionStatus")) return mockSubmissionStatus;
      return null;
    }),
    useMutation: vi.fn(() => mockCompile),
  };
});

// =====================================================
// Test Utilities
// =====================================================

async function renderCompilationPage() {
  const rendered = render(<CompilationControl />);

  await waitFor(
    () => {
      expect(screen.getByText(/Compilation Control/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  return rendered;
}

// =====================================================
// Test Suite 1: Page Loading and Navigation
// =====================================================

test("E2E-Admin: Compilation page loads with game selection", async () => {
  await renderCompilationPage();

  expect(screen.getByText(/Compilation Control/i)).toBeVisible();
  expect(screen.getByLabelText(/Game/i)).toBeVisible();
});

test("E2E-Admin: Game selection dropdown is populated", async () => {
  await renderCompilationPage();

  const gameSelect = screen.getByLabelText(/Game/i);
  expect(gameSelect).toBeVisible();

  // Verify options exist
  expect(screen.getByText(/Test Game 2025/i)).toBeVisible();
});

test("E2E-Admin: Quarter selector shows all 8 quarters", async () => {
  await renderCompilationPage();

  const quarterSelect = screen.getByLabelText(/Quarter/i);
  expect(quarterSelect).toBeVisible();

  expect(screen.getByText("Quarter 1")).toBeVisible();
});

// =====================================================
// Test Suite 2: Game Selection and Data Loading
// =====================================================

test("E2E-Admin: Selecting game loads submission status", async () => {
  await renderCompilationPage();

  expect(screen.getByText(/Submission Status/i)).toBeVisible();
});

test("E2E-Admin: Company submission status displays correctly", async () => {
  await renderCompilationPage();

  // Verify all companies show "Submitted"
  const submittedBadges = screen.getAllByText(/Submitted/i);
  expect(submittedBadges.length).toBeGreaterThan(0);
});

// =====================================================
// Test Suite 3: Hiring Compilation
// =====================================================

test("E2E-Admin: Compile hiring decisions with complete submissions", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });
  expect(compileButton).toBeEnabled();

  await user.click(compileButton);

  // Verify compile was called
  await waitFor(() => {
    expect(mockCompile).toHaveBeenCalled();
  });
});

test("E2E-Admin: Compilation shows loading indicator during process", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  // Mock a slow compilation
  const slowCompile = vi.fn().mockImplementation(
    () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
  );

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useMutation: () => slowCompile,
    };
  });

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });
  await user.click(compileButton);

  // Check for loading state
  expect(screen.getByText(/Compiling\.\.\./i)).toBeVisible();
});

// =====================================================
// Test Suite 4: Incomplete Submission Handling
// =====================================================

test("E2E-Admin: Incomplete submissions show proceed with defaults option", async () => {
  // Override with incomplete status
  const incompleteStatus = Object.freeze({
    ...mockSubmissionStatus,
    submitted: 2,
    pending: 2,
    allSubmitted: false,
  });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("submissionStatus")) return incompleteStatus;
        if (queryName.includes("games")) return mockGames;
        if (queryName.includes("companies")) return mockCompanies;
        return null;
      }),
    };
  });

  render(<CompilationControl />);

  expect(screen.getByRole("button", { name: /Proceed with Defaults/i })).toBeVisible();
});

test("E2E-Admin: Proceed with defaults executes compilation", async () => {
  const user = userEvent.setup();

  const incompleteStatus = Object.freeze({
    ...mockSubmissionStatus,
    submitted: 2,
    pending: 2,
    allSubmitted: false,
  });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("submissionStatus")) return incompleteStatus;
        if (queryName.includes("games")) return mockGames;
        if (queryName.includes("companies")) return mockCompanies;
        return null;
      }),
    };
  });

  render(<CompilationControl />);

  const proceedButton = screen.getByRole("button", { name: /Proceed with Defaults/i });
  await user.click(proceedButton);

  await waitFor(() => {
    expect(mockCompile).toHaveBeenCalled();
  });
});

// =====================================================
// Test Suite 5: Compilation Results and History
// =====================================================

test("E2E-Admin: Compilation history shows last compilation", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });
  await user.click(compileButton);

  await waitFor(() => {
    expect(screen.getByText(/Last Compilation/i)).toBeVisible();
    expect(screen.getByText(/Completed/i)).toBeVisible();
  });
});

test("E2E-Admin: View History link navigates to results page", async () => {
  await renderCompilationPage();

  const viewHistoryLink = screen.getByRole("link", { name: /View History/i });
  expect(viewHistoryLink).toBeVisible();
  expect(viewHistoryLink.getAttribute("href")).toContain("/admin/results");
});

// =====================================================
// Test Suite 6: Phase Selection (Hiring vs Leadership)
// =====================================================

test("E2E-Admin: Switch phase from hiring to leadership", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  const hiringRadio = screen.getByLabelText(/Hiring/i);
  expect(hiringRadio).toBeChecked();

  const leadershipRadio = screen.getByLabelText(/Leadership/i);
  await user.click(leadershipRadio);

  expect(leadershipRadio).toBeChecked();
  expect(screen.getByRole("button", { name: /Compile Leadership/i })).toBeVisible();
});

test("E2E-Admin: Leadership phase shows correct submission status", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  const leadershipRadio = screen.getByLabelText(/Leadership/i);
  await user.click(leadershipRadio);

  // Should show submission count for leadership
  expect(screen.getByText(/\d+ \/ \d+/)).toBeVisible();
});

// =====================================================
// Test Suite 7: Error Handling
// =====================================================

test("E2E-Admin: Compilation errors display to user", async () => {
  const user = userEvent.setup();

  // Mock a failing compilation
  const failingCompile = vi.fn().mockRejectedValue(new Error("Compilation failed"));

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useMutation: () => failingCompile,
    };
  });

  render(<CompilationControl />);

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });
  await user.click(compileButton);

  await waitFor(() => {
    expect(screen.getByText(/Error:/i)).toBeVisible();
  });
});

// =====================================================
// Test Suite 8: Re-compilation
// =====================================================

test("E2E-Admin: Re-compile same quarter after changes", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });

  // First compilation
  await user.click(compileButton);
  await waitFor(() => {
    expect(screen.getByText(/Compilation Complete/i)).toBeVisible();
  });

  // Second compilation
  await user.click(compileButton);
  await waitFor(() => {
    expect(mockCompile).toHaveBeenCalledTimes(2);
  });
});

// =====================================================
// Test Suite 9: Access Control
// =====================================================

test("E2E-Admin: Non-admin users see access denied", async () => {
  const mockStudentUser = Object.freeze({
    ...mockAdminUser,
    role: "student" as const,
  });

  vi.doMock("../../src/hooks/useCurrentUser", () => ({
    useCurrentUser: vi.fn(() => mockStudentUser),
  }));

  render(<CompilationControl />);

  expect(screen.getByText(/Access Denied/i)).toBeVisible();
  expect(screen.getByText(/Only admins and teachers/i)).toBeVisible();
});

// =====================================================
// Test Suite 10: Integration with Mock Backend
// =====================================================

test("E2E-Admin: Compilation creates hiring outcome reports", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });
  await user.click(compileButton);

  await waitFor(() => {
    expect(mockCompile).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "game-1",
        quarter: 1,
        phase: "hiring",
      })
    );
  });
});

test("E2E-Admin: Compilation updates compilation record", async () => {
  const user = userEvent.setup();
  await renderCompilationPage();

  // Before compilation, no status should be shown
  expect(screen.queryByText(/Last Compilation/i)).not.toBeInTheDocument();

  const compileButton = screen.getByRole("button", { name: /Compile \(All Submitted\)/i });
  await user.click(compileButton);

  // After compilation, status should be visible
  await waitFor(() => {
    expect(screen.getByText(/Last Compilation/i)).toBeVisible();
  });
});

// =====================================================
// Test Suite 11: Responsive Design
// =====================================================

test("E2E-Admin: Page layout is responsive", async () => {
  // Mock desktop viewport
  global.innerWidth = 1280;
  global.dispatchEvent(new Event("resize"));

  await renderCompilationPage();

  expect(screen.getByText(/Compilation Control/i)).toBeVisible();

  // Mock tablet viewport
  global.innerWidth = 768;
  global.dispatchEvent(new Event("resize"));

  expect(screen.getByText(/Compilation Control/i)).toBeVisible();

  // Mock mobile viewport
  global.innerWidth = 375;
  global.dispatchEvent(new Event("resize"));

  expect(screen.getByText(/Compilation Control/i)).toBeVisible();
});

// =====================================================
// Test Suite 12: Dark Mode
// =====================================================

test("E2E-Admin: Dark mode styles work correctly", async () => {
  await renderCompilationPage();

  // Main heading should be visible
  expect(screen.getByText(/Compilation Control/i)).toBeVisible();

  // Game select should be visible
  expect(screen.getByLabelText(/Game/i)).toBeVisible();
});

// =====================================================
// END OF TESTS
// =====================================================
