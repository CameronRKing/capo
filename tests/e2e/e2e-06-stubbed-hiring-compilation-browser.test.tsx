/**
 * E2E-06: Stubbed Hiring Compilation
 *
 * Tests the admin/teacher compilation page for triggering hiring compilations.
 * This is a stubbed feature - we test the UI and workflow, not the actual compilation logic.
 *
 * Page under test: /admin/compilation (AdminCompilationPage)
 *
 * Features tested:
 * - Teacher can access compilation page
 * - Game/quarter/phase selection
 * - Submission status display (stubbed data)
 * - Compilation actions (stubbed)
 * - Compilation status display
 * - End-to-end teacher workflow
 *
 * Run with: `npm run test:e2e`
 */

import React from "react";
import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminCompilationPage } from "../../src/routes/admin/compilation";
import { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

/**
 * Mock test data fixtures
 */
const mockGameId = "game123" as Id<"games">;
const mockCompanyId1 = "company1" as Id<"companies">;
const mockCompanyId2 = "company2" as Id<"companies">;
const mockCompanyId3 = "company3" as Id<"companies">;
const mockCompanyId4 = "company4" as Id<"companies">;

const mockTeacherUser = {
  _id: "user123" as Id<"users">,
  name: "Test Teacher",
  email: "teacher@test.com",
  role: "teacher" as const,
  gameId: mockGameId,
  companyId: undefined,
};

const mockGames = [
  {
    _id: mockGameId,
    name: "Test Game 1",
    currentQuarter: 2,
    status: "active" as const,
  },
  {
    _id: "game456" as Id<"games">,
    name: "Test Game 2",
    currentQuarter: 1,
    status: "active" as const,
  },
];

const mockCompanies = [
  { _id: mockCompanyId1, name: "Company A", industry: "Technology" },
  { _id: mockCompanyId2, name: "Company B", industry: "Healthcare" },
  { _id: mockCompanyId3, name: "Company C", industry: "Finance" },
  { _id: mockCompanyId4, name: "Company D", industry: "Manufacturing" },
];

const mockSubmissionStatusAllSubmitted = {
  totalCompanies: 4,
  submittedCompanies: 4,
  missingCompanies: 0,
  missing: [],
  canProceedWithDefaults: true,
};

const mockSubmissionStatusPartial = {
  totalCompanies: 4,
  submittedCompanies: 2,
  missingCompanies: 2,
  missing: [
    { companyId: mockCompanyId3, name: "Company C" },
    { companyId: mockCompanyId4, name: "Company D" },
  ],
  canProceedWithDefaults: true,
};

const mockCompilationStatus = {
  _id: "compilation123" as Id<"compilations">,
  status: "success" as const,
  startedAt: Date.now() - 1000000,
  completedAt: Date.now() - 900000,
  companiesProcessed: 4,
  errorMessage: null,
  compiledBy: { name: "Test Teacher", email: "teacher@test.com" },
};

const mockCompilationResult = {
  success: true,
  companiesProcessed: 4,
  poachingEvents: 2,
  hiringEvents: 8,
  errors: [],
};

/**
 * Mock Convex React hooks
 */
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useAction: vi.fn(),
  };
});

// Mock TanStack Router Link
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  };
});

import { useQuery, useAction } from "convex/react";

/**
 * Helper: Setup default mocks
 */
function setupDefaultMocks() {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    // Mock getCurrentUser
    if (fn?.name === "getCurrent") {
      return mockTeacherUser;
    }
    // Mock listGames
    if (fn?.name === "listGames") {
      return mockGames;
    }
    // Mock listGameCompanies
    if (fn?.name === "listGameCompanies") {
      return mockCompanies;
    }
    // Mock checkSubmissionStatus (stubbed - returns undefined initially)
    if (fn?.name === "checkSubmissionStatus") {
      return undefined; // Will be updated in tests
    }
    // Mock getCompilationStatus
    if (fn?.name === "getCompilationStatus") {
      return mockCompilationStatus;
    }
    return undefined;
  });

  vi.mocked(useAction).mockReturnValue(vi.fn());
}

/**
 * Helper: Render the compilation page
 */
async function renderCompilationPage() {
  setupDefaultMocks();
  const rendered = render(<AdminCompilationPage />);

  // Wait for page to load
  await waitFor(
    () => {
      expect(screen.getByText("Compilation Control")).toBeVisible();
    },
    { timeout: 5000 }
  );

  return rendered;
}

/**
 * Test 1: Page renders correctly for teacher
 */
test.skip("E2E-06: Page renders correctly for teacher", async () => {
  await renderCompilationPage();

  // Verify main heading
  expect(screen.getByText("Compilation Control")).toBeVisible();
  expect(screen.getByText(/trigger compilation processes/i)).toBeVisible();

  // Verify game selector exists
  expect(screen.getByLabelText(/game/i)).toBeVisible();

  // Verify quarter selector exists
  expect(screen.getByLabelText(/quarter/i)).toBeVisible();

  // Verify phase selector (radio buttons)
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(2);
});

/**
 * Test 2: Teacher can only see their assigned game
 */
test.skip("E2E-06: Teacher sees only their assigned game", async () => {
  await renderCompilationPage();

  const gameSelect = screen.getByLabelText(/game/i) as HTMLSelectElement;
  expect(gameSelect).toBeVisible();

  // Should show "Select game..." option + teacher's game
  const options = Array.from(gameSelect.options);
  expect(options).toHaveLength(2); // placeholder + 1 game
  expect(options[1].textContent).toContain("Test Game 1");
});

/**
 * Test 3: Game selector displays available games
 */
test.skip("E2E-06: Game selector displays games correctly", async () => {
  await renderCompilationPage();

  const gameSelect = screen.getByLabelText(/game/i) as HTMLSelectElement;

  // Check placeholder
  expect(screen.getByText(/select game/i)).toBeVisible();

  // Select a game
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Verify selection
  expect(gameSelect.value).toBe(mockGameId);
});

/**
 * Test 4: Quarter selector works
 */
test.skip("E2E-06: Quarter selector allows selection", async () => {
  await renderCompilationPage();

  const quarterSelect = screen.getByLabelText(/quarter/i) as HTMLSelectElement;

  // Should have quarters 1-8
  expect(quarterSelect.options.length).toBe(8);

  // Select Q2
  await userEvent.selectOptions(quarterSelect, "2");
  expect(quarterSelect.value).toBe("2");
});

/**
 * Test 5: Phase selector (Hiring/Leadership)
 */
test.skip("E2E-06: Phase selector toggles between Hiring and Leadership", async () => {
  await renderCompilationPage();

  const radios = screen.getAllByRole("radio");
  const hiringRadio = radios[0];
  const leadershipRadio = radios[1];

  // Initially "Hiring" is selected
  expect(hiringRadio).toBeChecked();
  expect(leadershipRadio).not.toBeChecked();

  // Click Leadership label
  const leadershipLabel = screen.getByText("Leadership", { selector: "span" }).closest("label");
  await userEvent.click(leadershipLabel!);

  // Now Leadership is selected
  expect(leadershipRadio).toBeChecked();
  expect(hiringRadio).not.toBeChecked();
});

/**
 * Test 6: Submission status displays after selection
 */
test.skip("E2E-06: Submission status displays when game selected", async () => {
  // Update mock to return submission status after selection
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusAllSubmitted;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game and quarter
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for submission status to appear
  await waitFor(
    () => {
      expect(screen.getByText(/Submission Status/i)).toBeVisible();
    },
    { timeout: 3000 }
  );

  // Verify company list
  expect(screen.getByText("Company A")).toBeVisible();
  expect(screen.getByText("Company B")).toBeVisible();
  expect(screen.getByText("Company C")).toBeVisible();
  expect(screen.getByText("Company D")).toBeVisible();
});

/**
 * Test 7: Submission badges show correct status
 */
test.skip("E2E-06: Company submission badges display correctly", async () => {
  // Mock with partial submission status
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusPartial;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for company list
  await waitFor(() => {
    expect(screen.getByText("Company A")).toBeVisible();
  });

  // Verify submitted badges
  expect(screen.getAllByText(/submitted/i)).toHaveLength(2);

  // Verify pending badges
  expect(screen.getAllByText(/pending/i)).toHaveLength(2);
});

/**
 * Test 8: Compilation status displays previous compilation
 */
test.skip("E2E-06: Previous compilation status displays", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusAllSubmitted;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for compilation status
  await waitFor(() => {
    expect(screen.getByText(/last compilation/i)).toBeVisible();
  });

  // Verify status details
  expect(screen.getByText(/completed/i)).toBeVisible();
  expect(screen.getByText(/companies: 4/i)).toBeVisible();
});

/**
 * Test 9: Compile button appears when all submitted
 */
test.skip("E2E-06: Compile button enabled when all companies submitted", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusAllSubmitted;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for compile button
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /compile \(all submitted\)/i })).toBeVisible();
  });

  // Verify "Proceed with Defaults" button is NOT present (no missing companies)
  expect(screen.queryByText(/proceed with defaults/i)).not.toBeInTheDocument();
});

/**
 * Test 10: Proceed with Defaults appears when companies missing
 */
test.skip("E2E-06: Proceed with Defaults button appears when companies missing", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusPartial;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for "Proceed with Defaults" button
  await waitFor(() => {
    expect(screen.getByText(/proceed with defaults/i)).toBeVisible();
  });

  // Verify it shows missing count
  expect(screen.getByText(/\(2 missing\)/i)).toBeVisible();
});

/**
 * Test 11: Submission count displays correctly
 */
test.skip("E2E-06: Submission count displays", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusPartial;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for submission count
  await waitFor(() => {
    expect(screen.getByText(/2 \/ 4/i)).toBeVisible();
  });
});

/**
 * Test 12: Access denied for non-admin/teacher
 */
test.skip("E2E-06: Access denied for student role", async () => {
  const mockStudentUser = {
    _id: "user456" as Id<"users">,
    name: "Test Student",
    email: "student@test.com",
    role: "student" as const,
  };

  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockStudentUser;
    return undefined;
  });

  render(<AdminCompilationPage />);

  // Should show access denied
  await waitFor(() => {
    expect(screen.getByText(/access denied/i)).toBeVisible();
  });
});

/**
 * Test 13: Compilation shows loading state (stubbed)
 */
test.skip("E2E-06: Compilation shows loading state", async () => {
  let isCompiling = false;
  const mockCompileAction = vi.fn();

  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusAllSubmitted;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  // Mock useAction to track compilation calls
  vi.mocked(useAction).mockReturnValue(mockCompileAction);

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for compile button
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /compile \(all submitted\)/i })).toBeVisible();
  });

  // Note: Actual compilation is stubbed, so we can't test real loading state
  // This test verifies the button exists and would trigger compilation
  expect(screen.getByRole("button", { name: /compile/i })).toBeVisible();
});

/**
 * Test 14: Phase selector updates compilation button text
 */
test.skip("E2E-06: Compilation button text updates with phase", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusAllSubmitted;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game first
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for initial button
  await waitFor(() => {
    expect(screen.getByText(/compile hiring decisions/i)).toBeVisible();
  });

  // Switch to Leadership phase
  const leadershipLabel = screen.getByText("Leadership", { selector: "span" }).closest("label");
  await userEvent.click(leadershipLabel!);

  // Button text should update
  await waitFor(() => {
    expect(screen.getByText(/compile leadership decisions/i)).toBeVisible();
  });
});

/**
 * Test 15: Empty state when no game selected
 */
test.skip("E2E-06: Shows empty state when no game selected", async () => {
  setupDefaultMocks();
  render(<AdminCompilationPage />);

  // Wait for page load
  await waitFor(() => {
    expect(screen.getByText("Compilation Control")).toBeVisible();
  });

  // Verify empty state message
  expect(screen.getByText(/no game selected/i)).toBeVisible();
  expect(screen.getByText(/select a game to view submission status/i)).toBeVisible();
});

/**
 * Test 16: Loading state displays while fetching
 */
test.skip("E2E-06: Loading state displays", async () => {
  // Mock to return undefined initially (loading)
  vi.mocked(useQuery).mockReturnValue(undefined);

  render(<AdminCompilationPage />);

  // Should show loading
  expect(screen.getByText(/loading/i)).toBeVisible();
});

/**
 * Test 17: Quarter selector disabled when no game selected
 */
test.skip("E2E-06: Quarter selector disabled without game", async () => {
  setupDefaultMocks();
  render(<AdminCompilationPage />);

  const quarterSelect = screen.getByLabelText(/quarter/i) as HTMLSelectElement;

  // Should be disabled when no game selected
  expect(quarterSelect).toBeDisabled();
});

/**
 * Test 18: Quarter selector enabled when game selected
 */
test.skip("E2E-06: Quarter selector enabled after game selection", async () => {
  setupDefaultMocks();
  render(<AdminCompilationPage />);

  const gameSelect = screen.getByLabelText(/game/i) as HTMLSelectElement;
  const quarterSelect = screen.getByLabelText(/quarter/i) as HTMLSelectElement;

  // Initially disabled
  expect(quarterSelect).toBeDisabled();

  // Select game
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Now enabled
  expect(quarterSelect).not.toBeDisabled();
});

/**
 * Test 19: Company industry displays in submission status
 */
test.skip("E2E-06: Company industry displays", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusAllSubmitted;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);

  // Wait for companies to appear
  await waitFor(() => {
    expect(screen.getByText("Company A")).toBeVisible();
  });

  // Verify industries
  expect(screen.getByText("Technology")).toBeVisible();
  expect(screen.getByText("Healthcare")).toBeVisible();
  expect(screen.getByText("Finance")).toBeVisible();
  expect(screen.getByText("Manufacturing")).toBeVisible();
});

/**
 * Test 20: End-to-end teacher workflow
 */
test.skip("E2E-06: End-to-end teacher workflow", async () => {
  vi.mocked(useQuery).mockImplementation((fn: any) => {
    if (fn?.name === "getCurrent") return mockTeacherUser;
    if (fn?.name === "listGames") return mockGames;
    if (fn?.name === "listGameCompanies") return mockCompanies;
    if (fn?.name === "checkSubmissionStatus") return mockSubmissionStatusPartial;
    if (fn?.name === "getCompilationStatus") return mockCompilationStatus;
    return undefined;
  });

  await renderCompilationPage();

  // Step 1: Verify page loaded
  expect(screen.getByText("Compilation Control")).toBeVisible();

  // Step 2: Select game
  const gameSelect = screen.getByLabelText(/game/i);
  await userEvent.selectOptions(gameSelect, mockGameId);
  expect(gameSelect).toHaveValue(mockGameId);

  // Step 3: Select quarter
  const quarterSelect = screen.getByLabelText(/quarter/i);
  await userEvent.selectOptions(quarterSelect, "2");
  expect(quarterSelect).toHaveValue("2");

  // Step 4: Verify phase is Hiring (default)
  const hiringRadio = screen.getAllByRole("radio")[0];
  expect(hiringRadio).toBeChecked();

  // Step 5: View submission status
  await waitFor(() => {
    expect(screen.getByText(/Submission Status/i)).toBeVisible();
  });

  // Step 6: Verify submission count
  expect(screen.getByText(/2 \/ 4/i)).toBeVisible();

  // Step 7: Verify companies list
  expect(screen.getByText("Company A")).toBeVisible();
  expect(screen.getByText("Company B")).toBeVisible();
  expect(screen.getByText("Company C")).toBeVisible();
  expect(screen.getByText("Company D")).toBeVisible();

  // Step 8: Verify missing companies warning
  expect(screen.getByText(/2 companies not submitted/i)).toBeVisible();

  // Step 9: Verify "Proceed with Defaults" button
  expect(screen.getByText(/proceed with defaults/i)).toBeVisible();

  // Step 10: Verify previous compilation status
  expect(screen.getByText(/last compilation/i)).toBeVisible();
  expect(screen.getByText(/completed/i)).toBeVisible();

  // Workflow complete - all UI elements verified
  expect(screen.getByText(/companies: 4/i)).toBeVisible();
});
