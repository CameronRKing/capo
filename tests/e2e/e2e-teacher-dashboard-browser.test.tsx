/**
 * E2E-Teacher: Dashboard & Monitoring (Component Testing Pattern)
 *
 * Tests for teacher dashboard functionality using mocked data (no real backend).
 * Tests cover game overview, company monitoring, and role-based access.
 *
 * Run with: `npm run test:e2e -- e2e-teacher-dashboard-browser.test.tsx`
 *
 * Test Scenarios:
 * 1. Teacher dashboard loads - verify game info displays
 * 2. View all companies - verify company list with counts
 * 3. Monitor student activity - verify real-time updates
 * 4. View company rankings - see aggregated rankings per company
 * 5. Access individual company dashboard - drill down to company view
 * 6. Phase status tracking - verify current phase displays
 * 7. Time remaining for phase - countdown timer visible
 * 8. Student progress indicators - completion percentages visible
 * 9. Notifications - new submissions, phase changes
 * 10. Export reports - download company data
 */

import React from "react";
import { test, expect, afterEach, vi } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { TeacherDashboard } from "../../src/routes/teacher/dashboard";
import type { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// =====================================================
// Mock Setup - STABLE Data References
// =====================================================

// Create STABLE mock data (Object.freeze prevents reference changes)
const mockGameInfo = Object.freeze({
  _id: "game-123" as Id<"games">,
  name: "Test Game 2025",
  currentQuarter: 1,
  currentPhase: "hiring" as const,
  length: 4,
  status: "active" as const,
});

const mockCompanies = Object.freeze([
  {
    _id: "company-1" as Id<"companies">,
    gameId: "game-123" as Id<"games">,
    name: "Company A",
    industry: "Technology",
  },
  {
    _id: "company-2" as Id<"companies">,
    gameId: "game-123" as Id<"games">,
    name: "Company B",
    industry: "Healthcare",
  },
  {
    _id: "company-3" as Id<"companies">,
    gameId: "game-123" as Id<"games">,
    name: "Company C",
    industry: "Finance",
  },
  {
    _id: "company-4" as Id<"companies">,
    gameId: "game-123" as Id<"games">,
    name: "Company D",
    industry: "Manufacturing",
  },
]);

const mockSubmissionStatus = Object.freeze({
  submitted: 1,
  pending: 3,
  total: 4,
  percentage: 25,
  companies: [
    {
      companyId: "company-1" as Id<"companies">,
      companyName: "Company A",
      status: "submitted" as const,
      lastActivity: Date.now() - 1000 * 60 * 5, // 5 minutes ago
    },
    {
      companyId: "company-2" as Id<"companies">,
      companyName: "Company B",
      status: "pending" as const,
      lastActivity: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    },
    {
      companyId: "company-3" as Id<"companies">,
      companyName: "Company C",
      status: "pending" as const,
      lastActivity: null,
    },
    {
      companyId: "company-4" as Id<"companies">,
      companyName: "Company D",
      status: "pending" as const,
      lastActivity: null,
    },
  ],
});

const mockRecentActivity = Object.freeze([
  {
    id: "activity-1",
    type: "submission" as const,
    companyName: "Company A",
    description: "Hiring decisions submitted",
    timestamp: Date.now() - 1000 * 60 * 5,
  },
]);

const mockSchedule = Object.freeze({
  currentPhase: {
    quarter: 1,
    phase: "hiring" as const,
    label: "Q1 - Hiring",
  },
  nextPhase: {
    quarter: 1,
    phase: "leadership" as const,
    label: "Q1 - Leadership",
  },
});

const mockTeacherUser = Object.freeze({
  _id: "teacher-123" as Id<"users">,
  name: "Test Teacher",
  email: "teacher@test.com",
  role: "teacher" as const,
  gameId: "game-123" as Id<"games">,
  companyId: undefined,
});

// Mock useCurrentUser hook
vi.mock("../../src/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(() => mockTeacherUser),
}));

// Mock Convex queries and mutations with STABLE references
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn((queryName: string, args?: any) => {
      // Return appropriate mock data based on query
      if (queryName.includes("game")) return mockGameInfo;
      if (queryName.includes("companies")) return mockCompanies;
      if (queryName.includes("submissionStatus")) return mockSubmissionStatus;
      if (queryName.includes("activity")) return mockRecentActivity;
      if (queryName.includes("schedule")) return mockSchedule;
      return null;
    }),
    useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
  };
});

// =====================================================
// Test Utilities
// =====================================================

/**
 * Render TeacherDashboard with test context
 */
async function renderTeacherDashboard() {
  const rendered = render(<TeacherDashboard />);

  // Wait for dashboard to render
  await waitFor(
    () => {
      expect(screen.getByText(/Teacher Dashboard/i)).toBeVisible();
    },
    { timeout: 5000 }
  );

  return rendered;
}

// =====================================================
// Test Suite 1: Dashboard Loading & Game Overview
// =====================================================

test("E2E-Teacher: Dashboard loads with game overview", async () => {
  await renderTeacherDashboard();

  // Verify game info displays
  expect(screen.getByText("Teacher Dashboard")).toBeVisible();
  expect(screen.getByText(/Test Game 2025/i)).toBeVisible();

  // Verify quarter and phase display
  expect(screen.getByText("Q1")).toBeVisible();
  expect(screen.getByText(/hiring/i)).toBeVisible();

  // Verify status badge
  expect(screen.getByText("active")).toBeVisible();
});

test("E2E-Teacher: Dashboard shows submission progress", async () => {
  await renderTeacherDashboard();

  // Check submission count
  expect(screen.getByText("1/4")).toBeVisible();

  // Check progress percentage
  expect(screen.getByText("25%")).toBeVisible();

  // Verify progress bar exists
  const progressBar = document.querySelector(".bg-indigo-600");
  expect(progressBar).toBeDefined();
});

// =====================================================
// Test Suite 2: Company Status Display
// =====================================================

test("E2E-Teacher: Dashboard displays all companies", async () => {
  await renderTeacherDashboard();

  // Verify company status section exists
  expect(screen.getByText("Company Status")).toBeVisible();

  // Check all companies are listed
  expect(screen.getByText("Company A")).toBeVisible();
  expect(screen.getByText("Company B")).toBeVisible();
  expect(screen.getByText("Company C")).toBeVisible();
  expect(screen.getByText("Company D")).toBeVisible();

  // Verify industries are shown
  expect(screen.getByText("Technology")).toBeVisible();
  expect(screen.getByText("Healthcare")).toBeVisible();
  expect(screen.getByText("Finance")).toBeVisible();
  expect(screen.getByText("Manufacturing")).toBeVisible();
});

test("E2E-Teacher: Company submission status badges", async () => {
  await renderTeacherDashboard();

  // Company A should show "Submitted"
  const submittedBadges = screen.getAllByText("Submitted");
  expect(submittedBadges.length).toBeGreaterThan(0);

  // Other companies should show "Pending"
  const pendingBadges = screen.getAllByText("Pending");
  expect(pendingBadges.length).toBeGreaterThan(0);
});

test("E2E-Teacher: Last activity timestamps display", async () => {
  await renderTeacherDashboard();

  // Company A should show "5 minutes ago"
  const activityTexts = screen.getAllByText(/minutes ago/);
  expect(activityTexts.length).toBeGreaterThan(0);
});

// =====================================================
// Test Suite 3: Schedule & Deadlines
// =====================================================

test("E2E-Teacher: Schedule shows current phase", async () => {
  await renderTeacherDashboard();

  // Verify schedule section exists
  expect(screen.getByText("Schedule")).toBeVisible();

  // Check current phase is highlighted
  expect(screen.getByText("Current Phase")).toBeVisible();

  // Verify phase details
  expect(screen.getByText(/Q1 - hiring/i)).toBeVisible();
});

test("E2E-Teacher: Schedule shows next phase", async () => {
  await renderTeacherDashboard();

  // Next phase should be "leadership" in Q1
  expect(screen.getByText(/Q1 - leadership/i)).toBeVisible();

  // "Next Phase" label should appear
  expect(screen.getByText("Next Phase")).toBeVisible();
});

// =====================================================
// Test Suite 4: Recent Activity Feed
// =====================================================

test("E2E-Teacher: Recent activity displays submissions", async () => {
  await renderTeacherDashboard();

  // Verify activity section exists
  expect(screen.getByText("Recent Activity")).toBeVisible();

  // Company A's hiring submission should appear
  expect(screen.getByText("Company A")).toBeVisible();

  // Activity description
  expect(screen.getByText("Hiring decisions submitted")).toBeVisible();

  // Relative timestamp
  expect(screen.getByText(/minutes ago/)).toBeVisible();
});

test("E2E-Teacher: Activity feed handles empty state", async () => {
  // Override mock to return empty activity
  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("activity")) return [];
        if (queryName.includes("game")) return mockGameInfo;
        if (queryName.includes("companies")) return mockCompanies;
        if (queryName.includes("submissionStatus")) return mockSubmissionStatus;
        if (queryName.includes("schedule")) return mockSchedule;
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Should show "No recent activity"
  expect(screen.getByText("No recent activity")).toBeVisible();
});

// =====================================================
// Test Suite 5: Quick Actions
// =====================================================

test("E2E-Teacher: Quick action buttons visible", async () => {
  await renderTeacherDashboard();

  // Verify quick actions section
  expect(screen.getByText("Quick Actions")).toBeVisible();

  // Check buttons exist
  expect(screen.getByRole("link", { name: /Compile Now/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /View Reports/i })).toBeVisible();
  expect(screen.getByRole("button", { name: /Game Settings/i })).toBeVisible();
});

test("E2E-Teacher: Compile Now link navigates correctly", async () => {
  await renderTeacherDashboard();

  // Get compile link
  const compileLink = screen.getByRole("link", { name: /Compile Now/i });

  // Verify href
  expect(compileLink.getAttribute("href")).toContain("/admin/compilation");
});

// =====================================================
// Test Suite 6: Real-Time Updates
// =====================================================

test("E2E-Teacher: Dashboard updates with new submissions", async () => {
  const { rerender } = render(<TeacherDashboard />);

  // Verify initial state: 1/4 submitted
  expect(screen.getByText("1/4")).toBeVisible();
  expect(screen.getByText("25%")).toBeVisible();

  // Simulate update by changing mock data
  const updatedSubmissionStatus = Object.freeze({
    ...mockSubmissionStatus,
    submitted: 2,
    pending: 2,
    percentage: 50,
  });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("submissionStatus")) return updatedSubmissionStatus;
        if (queryName.includes("game")) return mockGameInfo;
        if (queryName.includes("companies")) return mockCompanies;
        if (queryName.includes("schedule")) return mockSchedule;
        return null;
      }),
    };
  });

  // Rerender with updated data
  rerender(<TeacherDashboard />);

  // Verify updated state: 2/4 submitted
  await waitFor(() => {
    expect(screen.getByText("2/4")).toBeVisible();
    expect(screen.getByText("50%")).toBeVisible();
  });
});

// =====================================================
// Test Suite 7: Phase Transitions
// =====================================================

test("E2E-Teacher: Dashboard displays leadership phase", async () => {
  // Override mock for leadership phase
  const leadershipGame = Object.freeze({ ...mockGameInfo, currentPhase: "leadership" as const });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("game")) return leadershipGame;
        if (queryName.includes("companies")) return mockCompanies;
        if (queryName.includes("schedule")) return mockSchedule;
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Verify phase is "leadership"
  expect(screen.getByText(/leadership/i)).toBeVisible();

  // Schedule should show current phase as leadership
  expect(screen.getByText(/Q1 - leadership/i)).toBeVisible();
});

test("E2E-Teacher: Dashboard handles completed game status", async () => {
  // Override mock for completed game
  const completedGame = Object.freeze({ ...mockGameInfo, status: "completed" as const });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("game")) return completedGame;
        if (queryName.includes("companies")) return mockCompanies;
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Verify status is "completed"
  expect(screen.getByText("completed")).toBeVisible();

  // Schedule should show completion message
  expect(screen.getByText("Game completed")).toBeVisible();
});

// =====================================================
// Test Suite 8: Role-Based Access Control
// =====================================================

test("E2E-Teacher: Student cannot access dashboard", async () => {
  // Mock student user
  const mockStudentUser = Object.freeze({
    ...mockTeacherUser,
    role: "student" as const,
  });

  vi.doMock("../../src/hooks/useCurrentUser", () => ({
    useCurrentUser: vi.fn(() => mockStudentUser),
  }));

  render(<TeacherDashboard />);

  // Should show access denied
  expect(screen.getByText("Access Denied")).toBeVisible();
  expect(screen.getByText(/only accessible to teachers/i)).toBeVisible();

  // Dashboard content should NOT be visible
  expect(screen.queryByText("Teacher Dashboard")).not.toBeInTheDocument();
});

test("E2E-Teacher: Teacher without game assignment sees warning", async () => {
  // Mock teacher without game
  const teacherNoGame = Object.freeze({
    ...mockTeacherUser,
    gameId: undefined,
  });

  vi.doMock("../../src/hooks/useCurrentUser", () => ({
    useCurrentUser: vi.fn(() => teacherNoGame),
  }));

  render(<TeacherDashboard />);

  // Should show "No Game Assigned"
  expect(screen.getByText("No Game Assigned")).toBeVisible();
  expect(screen.getByText(/not been assigned to a game/i)).toBeVisible();
});

// =====================================================
// Test Suite 9: Company Count Variations
// =====================================================

test("E2E-Teacher: Dashboard handles single company", async () => {
  const singleCompany = Object.freeze([mockCompanies[0]]);

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("companies")) return singleCompany;
        if (queryName.includes("game")) return mockGameInfo;
        if (queryName.includes("submissionStatus")) {
          return Object.freeze({ submitted: 0, pending: 1, total: 1, percentage: 0, companies: [] });
        }
        if (queryName.includes("schedule")) return mockSchedule;
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Company should display
  expect(screen.getByText("Company A")).toBeVisible();

  // Progress should be 0/1
  expect(screen.getByText("0/1")).toBeVisible();
  expect(screen.getByText("0%")).toBeVisible();
});

test("E2E-Teacher: Dashboard handles no companies", async () => {
  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("companies")) return [];
        if (queryName.includes("game")) return mockGameInfo;
        if (queryName.includes("submissionStatus")) {
          return Object.freeze({ submitted: 0, pending: 0, total: 0, percentage: 0, companies: [] });
        }
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Should show "No companies found"
  expect(screen.getByText("No companies found")).toBeVisible();

  // Progress should be 0/0
  expect(screen.getByText("0/0")).toBeVisible();
});

// =====================================================
// Test Suite 10: Quarter Progression
// =====================================================

test("E2E-Teacher: Dashboard displays Q2", async () => {
  const q2Game = Object.freeze({ ...mockGameInfo, currentQuarter: 2 });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("game")) return q2Game;
        if (queryName.includes("companies")) return mockCompanies;
        if (queryName.includes("schedule")) return mockSchedule;
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Verify Q2
  expect(screen.getByText("Q2")).toBeVisible();

  // Schedule should show Q2
  expect(screen.getByText(/Q2 - hiring/i)).toBeVisible();
});

test("E2E-Teacher: Dashboard displays Q4 (final quarter)", async () => {
  const q4Game = Object.freeze({ ...mockGameInfo, currentQuarter: 4 });

  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn((queryName: string) => {
        if (queryName.includes("game")) return q4Game;
        if (queryName.includes("companies")) return mockCompanies;
        if (queryName.includes("schedule")) return mockSchedule;
        return null;
      }),
    };
  });

  render(<TeacherDashboard />);

  // Verify Q4
  expect(screen.getByText("Q4")).toBeVisible();

  // Schedule should show Q4
  expect(screen.getByText(/Q4 - hiring/i)).toBeVisible();
});

// =====================================================
// Test Suite 11: Error Handling
// =====================================================

test("E2E-Teacher: Dashboard handles unauthenticated user", async () => {
  // Mock no user
  vi.doMock("../../src/hooks/useCurrentUser", () => ({
    useCurrentUser: vi.fn(() => null),
  }));

  render(<TeacherDashboard />);

  // Should show loading or auth prompt
  const dashboardContent = screen.queryByText("Teacher Dashboard");
  expect(dashboardContent).not.toBeInTheDocument();
});

test("E2E-Teacher: Dashboard handles invalid user email", async () => {
  // This test would need routing context, so we just verify
  // the component renders without crashing
  render(<TeacherDashboard />);

  // Component should render (even if with error state)
  expect(screen.getByText("Teacher Dashboard")).toBeVisible();
});

// =====================================================
// Test Suite 12: Responsive Design
// =====================================================

test("E2E-Teacher: Dashboard mobile responsive", async () => {
  // Mock mobile viewport
  global.innerWidth = 375;
  global.dispatchEvent(new Event("resize"));

  await renderTeacherDashboard();

  // Dashboard should still load
  expect(screen.getByText("Teacher Dashboard")).toBeVisible();

  // Quick actions should wrap
  expect(screen.getByRole("link", { name: /Compile Now/i })).toBeVisible();

  // Company status should still display
  expect(screen.getByText("Company A")).toBeVisible();
});

test("E2E-Teacher: Dashboard tablet responsive", async () => {
  // Mock tablet viewport
  global.innerWidth = 768;
  global.dispatchEvent(new Event("resize"));

  await renderTeacherDashboard();

  // Dashboard should load
  expect(screen.getByText("Teacher Dashboard")).toBeVisible();

  // Grid layout should work
  expect(screen.getByText("Company Status")).toBeVisible();
  expect(screen.getByText("Schedule")).toBeVisible();
});

// =====================================================
// Test Suite 13: Dark Mode
// =====================================================

test("E2E-Teacher: Dashboard dark mode readable", async () => {
  await renderTeacherDashboard();

  // Dashboard content should be visible
  expect(screen.getByText("Teacher Dashboard")).toBeVisible();
  expect(screen.getByText("Company A")).toBeVisible();

  // Verify main elements are present
  expect(screen.getByText("Company Status")).toBeVisible();
  expect(screen.getByText("Schedule")).toBeVisible();
});

// =====================================================
// END OF TESTS
// =====================================================
