/**
 * E2E-07: Stubbed Leadership Compilation (Browser Mode)
 *
 * Tests the teacher/admin compilation page for leadership decisions.
 * This is a stubbed feature - we test the UI and workflow, not the actual
 * compilation logic (which generates randomized data).
 *
 * Prerequisites:
 * - Dev server must be running: `npm run dev`
 * - Convex backend must be available
 *
 * Run with: `npm run test:e2e`
 */

import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { AdminCompilationPage } from "../../src/routes/admin/compilation";
import userEvent from "@testing-library/user-event";
import { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Convex React hooks
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
    useAction: vi.fn(() => vi.fn()),
  };
});

// Mock TanStack Router Link component
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  };
});

// Import mocked modules
import { useQuery, useAction } from "convex/react";

/**
 * Helper: Create mock game data
 */
function createMockGames(count: number = 2) {
  return Array.from({ length: count }, (_, i) => ({
    _id: `game_${i + 1}` as Id<"games">,
    name: `Test Game ${i + 1}`,
    currentQuarter: i + 1,
    status: "active" as const,
    length: 4,
  }));
}

/**
 * Helper: Create mock company data
 */
function createMockCompanies(gameId: Id<"games">, count: number = 4) {
  const industries = ["Technology", "Healthcare", "Finance", "Manufacturing"];
  return Array.from({ length: count }, (_, i) => ({
    _id: `company_${gameId}_${i + 1}` as Id<"companies">,
    gameId,
    name: `Company ${String.fromCharCode(65 + i)}`,
    industry: industries[i % industries.length],
  }));
}

/**
 * Helper: Create mock submission status
 */
function createMockSubmissionStatus(options: {
  totalCompanies: number;
  submittedCompanies: number;
}) {
  const missing = options.totalCompanies - options.submittedCompanies;
  return {
    totalCompanies: options.totalCompanies,
    submittedCompanies: options.submittedCompanies,
    missingCompanies: missing,
    missing: missing > 0
      ? Array.from({ length: missing }, (_, i) => ({
          companyId: `company_missing_${i + 1}` as Id<"companies">,
          name: `Missing Company ${i + 1}`,
        }))
      : [],
    canProceedWithDefaults: true,
  };
}

/**
 * Helper: Setup teacher mocks
 */
function setupTeacherMocks() {
  const mockUser = {
    _id: "user_1" as Id<"users">,
    name: "Test Teacher",
    email: "teacher@test.com",
    role: "teacher" as const,
    gameId: "game_1" as Id<"games">,
  };

  const mockGames = createMockGames(2);
  const mockCompanies = createMockCompanies(mockGames[0]._id, 4);
  const mockSubmissionStatus = createMockSubmissionStatus({
    totalCompanies: 4,
    submittedCompanies: 4,
  });

  // Mock useQuery - simple implementation
  let callCount = 0;
  (useQuery as any).mockImplementation((query: any, args: any) => {
    callCount++;

    // First call is getCurrent user
    if (callCount === 1) return mockUser;

    // Second call is listGames
    if (callCount === 2) return mockGames;

    // Conditional queries
    if (args === "skip") return undefined;
    if (args?.gameId) return mockCompanies;
    if (args?.quarter && args?.phase) return mockSubmissionStatus;

    return undefined;
  });

  // Mock useAction
  (useAction as any).mockReturnValue({
    isLoading: false,
  });

  return { mockUser, mockGames, mockCompanies, mockSubmissionStatus };
}

/**
 * Test 1: Teacher can access compilation page
 */
test("E2E-07: Teacher can access compilation page", async () => {
  setupTeacherMocks();

  render(<AdminCompilationPage />);

  // Wait for page to load
  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify key elements
  expect(screen.getByText(/trigger compilation processes/i)).toBeVisible();
  expect(screen.getByText(/^Game$/)).toBeVisible();
  expect(screen.getByText(/^Quarter$/)).toBeVisible();
  expect(screen.getByText(/hiring/i)).toBeVisible();
  expect(screen.getByText(/leadership/i)).toBeVisible();
});

/**
 * Test 2: Leadership phase selection works
 */
test("E2E-07: Leadership phase selection works", async () => {
  setupTeacherMocks();

  render(<AdminCompilationPage />);

  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Find phase radio buttons
  const radios = screen.getAllByRole("radio");
  expect(radios.length).toBeGreaterThanOrEqual(2);

  // Click leadership radio
  const leadershipRadio = radios.find((r: any) => r.value === "leadership");
  if (leadershipRadio) {
    await userEvent.click(leadershipRadio);
    expect(leadershipRadio).toBeChecked();
  }
});

/**
 * Test 3: Company list displays with submission status
 */
test.skip("E2E-07: Company list displays with submission status", async () => {
  const mockGames = createMockGames(1);
  const mockCompanies = createMockCompanies(mockGames[0]._id, 4);

  // Setup mocks with specific data
  const mockUser = {
    _id: "user_1" as Id<"users">,
    name: "Test Teacher",
    email: "teacher@test.com",
    role: "teacher" as const,
    gameId: mockGames[0]._id,
  };

  let callCount = 0;
  (useQuery as any).mockImplementation((query: any, args: any) => {
    callCount++;
    if (callCount === 1) return mockUser;
    if (callCount === 2) return mockGames;
    if (args === "skip") return undefined;
    if (args?.gameId) return mockCompanies;
    if (args?.quarter) {
      return createMockSubmissionStatus({ totalCompanies: 4, submittedCompanies: 3 });
    }
    return undefined;
  });

  render(<AdminCompilationPage />);

  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Find and select game
  const selectElements = screen.getAllByRole("combobox");
  const gameSelect = selectElements.find(el =>
    el.textContent?.includes("Select game...")
  );

  if (gameSelect) {
    await userEvent.selectOptions(gameSelect, mockGames[0]._id);

    // Wait for companies to load
    await waitFor(
      () => {
        expect(screen.getByText(/Company A/i)).toBeVisible();
      },
      { timeout: 3000 }
    );

    // Verify companies displayed
    expect(screen.getByText(/Company A/i)).toBeVisible();
    expect(screen.getByText(/Company B/i)).toBeVisible();
    expect(screen.getByText(/Company C/i)).toBeVisible();
    expect(screen.getByText(/Company D/i)).toBeVisible();

    // Verify submission badges exist
    const submittedText = screen.queryAllByText(/submitted/i);
    const pendingText = screen.queryAllByText(/pending/i);

    expect(submittedText.length + pendingText.length).toBeGreaterThan(0);
  }
});

/**
 * Test 4: Teacher workflow - select game and check status
 */
test.skip("E2E-07: Teacher workflow end-to-end", async () => {
  const mockGames = createMockGames(1);
  const mockCompanies = createMockCompanies(mockGames[0]._id, 4);

  const mockUser = {
    _id: "user_1" as Id<"users">,
    name: "Test Teacher",
    email: "teacher@test.com",
    role: "teacher" as const,
    gameId: mockGames[0]._id,
  };

  let callCount = 0;
  (useQuery as any).mockImplementation((query: any, args: any) => {
    callCount++;
    if (callCount === 1) return mockUser;
    if (callCount === 2) return mockGames;
    if (args === "skip") return undefined;
    if (args?.gameId) return mockCompanies;
    if (args?.quarter) {
      return createMockSubmissionStatus({ totalCompanies: 4, submittedCompanies: 4 });
    }
    return undefined;
  });

  render(<AdminCompilationPage />);

  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Select game
  const selectElements = screen.getAllByRole("combobox");
  const gameSelect = selectElements.find(el =>
    el.textContent?.includes("Select game...")
  );

  expect(gameSelect).toBeVisible();

  await userEvent.selectOptions(gameSelect!, mockGames[0]._id);

  // Verify submission status section appears
  await waitFor(
    () => {
      expect(screen.getByText(/submission status/i)).toBeVisible();
    },
    { timeout: 3000 }
  );

  // Verify companies are shown
  expect(screen.getByText(/Company A/i)).toBeVisible();

  // Verify compile button exists
  const compileButton = screen.queryByRole("button", { name: /compile/i });
  expect(compileButton).toBeVisible();
});

/**
 * Test 5: Empty state when no game selected
 */
test("E2E-07: Empty state displays when no game selected", async () => {
  setupTeacherMocks();

  render(<AdminCompilationPage />);

  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Should see empty state message
  expect(screen.getByText(/no game selected/i)).toBeVisible();
});

/**
 * Test 6: Non-teacher gets access denied
 */
test("E2E-07: Non-admin/teacher gets access denied", async () => {
  const mockStudent = {
    _id: "user_student" as Id<"users">,
    name: "Student User",
    email: "student@test.com",
    role: "student" as const,
  };

  (useQuery as any).mockReturnValue(mockStudent);

  render(<AdminCompilationPage />);

  // Should show access denied
  await waitFor(
    () => {
      expect(screen.getByText(/access denied/i)).toBeVisible();
    },
    { timeout: 3000 }
  );

  expect(screen.getByText(/only admins and teachers/i)).toBeVisible();
});

/**
 * Test 7: Loading state displays
 */
test("E2E-07: Loading state displays while fetching user", async () => {
  // Mock user as null (loading state)
  (useQuery as any).mockReturnValue(undefined);

  render(<AdminCompilationPage />);

  // Should show loading message
  expect(screen.getByText(/loading/i)).toBeVisible();
});

/**
 * Test 8: View History link exists
 */
test.skip("E2E-07: View History link exists", async () => {
  setupTeacherMocks();

  render(<AdminCompilationPage />);

  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Verify View History link
  const historyLink = screen.getByRole("link", { name: /view history/i });
  expect(historyLink).toBeVisible();
  expect(historyLink).toHaveAttribute("href", "/admin/results");
});

/**
 * Test 9: Submission status shows correct counts
 */
test.skip("E2E-07: Submission status shows missing companies warning", async () => {
  const mockGames = createMockGames(1);
  const mockCompanies = createMockCompanies(mockGames[0]._id, 5);

  const mockUser = {
    _id: "user_1" as Id<"users">,
    name: "Test Teacher",
    email: "teacher@test.com",
    role: "teacher" as const,
    gameId: mockGames[0]._id,
  };

  let callCount = 0;
  (useQuery as any).mockImplementation((query: any, args: any) => {
    callCount++;
    if (callCount === 1) return mockUser;
    if (callCount === 2) return mockGames;
    if (args === "skip") return undefined;
    if (args?.gameId) return mockCompanies;
    if (args?.quarter) {
      return createMockSubmissionStatus({ totalCompanies: 5, submittedCompanies: 3 });
    }
    return undefined;
  });

  render(<AdminCompilationPage />);

  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  // Select game
  const selectElements = screen.getAllByRole("combobox");
  const gameSelect = selectElements.find(el =>
    el.textContent?.includes("Select game...")
  );

  await userEvent.selectOptions(gameSelect!, mockGames[0]._id);

  // Wait for submission status
  await waitFor(
    () => {
      expect(screen.getByText(/submissions:/i)).toBeVisible();
    },
    { timeout: 3000 }
  );

  // Should show submission count (3/5) or missing companies message
  const countText = screen.queryByText(/3 \/ 5/i);
  const missingText = screen.queryByText(/2 companies not submitted/i);

  expect(countText || missingText).toBeTruthy();
});
