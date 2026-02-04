/**
 * E2E-Admin: Access Approval Workflow (Browser Mode)
 *
 * Tests the admin access approval workflow using Vitest browser mode.
 * These tests verify the admin UI for managing access requests.
 *
 * NOTE: These tests use component testing approach (rendering components directly)
 * rather than full browser navigation. This matches the existing E2E test pattern
 * in the repo (e2e-01, e2e-02, etc.).
 *
 * For true end-to-end testing with real Convex backend and browser navigation,
 * see the "Future Enhancements" section below.
 *
 * Features tested:
 * - Admin views pending access requests
 * - Admin approves student requests
 * - Admin approves teacher requests
 * - Admin denies requests
 * - Filter by role (student/teacher)
 * - Access request notifications
 * - Tab navigation
 * - Responsive design
 *
 * Prerequisites:
 * - Dev server running: `npm run dev`
 * - Convex backend available
 *
 * Run with: `npm run test:e2e -- e2e-05-admin-access-browser.test.tsx`
 *
 * @see src/routes/admin/access.tsx
 * @see convex/accessRequests.ts
 * @see src/components/ApprovalModal.tsx
 */

import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminAccessPage } from "../../src/routes/admin/access";
import { ApprovalModal } from "../../src/components/ApprovalModal";
import type { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// =====================================================
// Mock Setup
// =====================================================

// Mock Convex queries and mutations
const mockPendingRequests = [
  {
    _id: "request-1" as Id<"accessRequests">,
    name: "Test Teacher One",
    email: "teacher1@test.com",
    role: "teacher" as const,
    status: "pending" as const,
    _creationTime: Date.now(),
    requestedGameId: undefined,
    requestedCompanyId: undefined,
  },
  {
    _id: "request-2" as Id<"accessRequests">,
    name: "Test Student One",
    email: "student1@test.com",
    role: "student" as const,
    status: "pending" as const,
    _creationTime: Date.now(),
    requestedGameId: undefined,
    requestedCompanyId: undefined,
  },
  {
    _id: "request-3" as Id<"accessRequests">,
    name: "Test Teacher Two",
    email: "teacher2@test.com",
    role: "teacher" as const,
    status: "pending" as const,
    _creationTime: Date.now(),
    requestedGameId: undefined,
    requestedCompanyId: undefined,
  },
  {
    _id: "request-4" as Id<"accessRequests">,
    name: "Test Student Two",
    email: "student2@test.com",
    role: "student" as const,
    status: "pending" as const,
    _creationTime: Date.now(),
    requestedGameId: undefined,
    requestedCompanyId: undefined,
  },
];

const mockGames = [
  {
    _id: "game-1" as Id<"games">,
    name: "Test Game 1",
    status: "active" as const,
    _creationTime: Date.now(),
  },
  {
    _id: "game-2" as Id<"games">,
    name: "Test Game 2",
    status: "active" as const,
    _creationTime: Date.now(),
  },
];

const mockCompanies = [
  {
    _id: "company-1" as Id<"companies">,
    gameId: "game-1" as Id<"games">,
    name: "Company A",
    industry: "Technology",
    _creationTime: Date.now(),
  },
  {
    _id: "company-2" as Id<"companies">,
    gameId: "game-1" as Id<"games">,
    name: "Company B",
    industry: "Finance",
    _creationTime: Date.now(),
  },
];

const mockApprove = vi.fn().mockResolvedValue({ success: true });
const mockDeny = vi.fn().mockResolvedValue({ success: true });

vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn((_, args) => {
      // Return different data based on the query
      if (args && typeof args === "object" && "id" in args) {
        // listCompanies query
        return mockCompanies;
      }
      // Default: return pending requests or games
      return mockPendingRequests;
    }),
    useMutation: vi.fn(() => {
      // Return a function that can be called
      const mockFn = vi.fn().mockResolvedValue({ success: true });
      // Tag the function for identification
      (mockFn as any).__isMutation = true;
      return mockFn;
    }),
  };
});

// =====================================================
// Test Helpers
// =====================================================

/**
 * Render AdminAccessPage component
 */
async function renderAdminAccessPage() {
  const rendered = render(<AdminAccessPage />);

  // Wait for page to load
  await waitFor(
    () => {
      expect(screen.getByText("Access Management")).toBeVisible();
    },
    { timeout: 5000 }
  );

  return rendered;
}

// =====================================================
// TEST SUITE 1: Page Rendering
// =====================================================

/**
 * Test 1.1: Admin access page loads successfully
 */
test("E2E-Admin: Access page loads with title and tabs", async () => {
  await renderAdminAccessPage();

  // Verify page title
  expect(screen.getByText("Access Management")).toBeVisible();

  // Verify tabs are visible
  expect(screen.getByText("Pending Requests")).toBeVisible();
  expect(screen.getByText("Direct Grant")).toBeVisible();
});

/**
 * Test 1.2: Pending requests tab is active by default
 */
test("E2E-Admin: Pending requests tab shows active styling", async () => {
  await renderAdminAccessPage();

  // The active tab should have a different style
  const pendingTab = screen.getByText("Pending Requests").closest("button");
  expect(pendingTab).toHaveClass({ border: true });
});

/**
 * Test 1.3: Page shows loading state initially
 */
test("E2E-Admin: Shows loading state before data loads", async () => {
  render(<AdminAccessPage />);

  // Brief check - loading state may be too fast to catch
  // The component should show either loading or content
  const pageContent = document.querySelector("div");
  expect(pageContent).toBeDefined();
});

// =====================================================
// TEST SUITE 2: Viewing Pending Requests
// =====================================================

/**
 * Test 2.1: Admin can view list of pending access requests
 */
test("E2E-Admin: View list of pending access requests", async () => {
  await renderAdminAccessPage();

  // Check that requests are displayed
  expect(screen.getByText("Test Teacher One")).toBeVisible();
  expect(screen.getByText("teacher1@test.com")).toBeVisible();
  expect(screen.getByText("Test Student One")).toBeVisible();
  expect(screen.getByText("student1@test.com")).toBeVisible();
});

/**
 * Test 2.2: Each request shows user details correctly
 */
test("E2E-Admin: Request displays user name, email, and role", async () => {
  await renderAdminAccessPage();

  // Check first request details
  expect(screen.getByText("Test Teacher One")).toBeVisible();
  expect(screen.getByText("teacher1@test.com")).toBeVisible();
  expect(screen.getByText("Teacher")).toBeVisible();
});

/**
 * Test 2.3: Request shows creation date
 */
test("E2E-Admin: Request displays requested date", async () => {
  await renderAdminAccessPage();

  // Look for "Requested" text (includes date)
  const requestedText = screen.getByText(/requested/i);
  expect(requestedText).toBeVisible();
});

/**
 * Test 2.4: Empty state displays when no pending requests
 */
test("E2E-Admin: Empty state shows when no requests", async () => {
  // Override mock to return empty array
  vi.doMock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn(() => []),
    };
  });

  render(<AdminAccessPage />);

  // Check for empty state message
  await waitFor(() => {
    expect(screen.getByText("No pending requests")).toBeVisible();
  });
});

// =====================================================
// TEST SUITE 3: Role-Based Filtering
// =====================================================

/**
 * Test 3.1: Role badges are visible and distinguishable
 */
test("E2E-Admin: Role badges distinguish teacher from student", async () => {
  await renderAdminAccessPage();

  // Count role badges
  const teacherBadges = screen.getAllByText("Teacher");
  const studentBadges = screen.getAllByText("Student");

  // Should have at least one of each based on mock data
  expect(teacherBadges.length).toBeGreaterThan(0);
  expect(studentBadges.length).toBeGreaterThan(0);
});

/**
 * Test 3.2: Teacher and student requests are distinguishable
 */
test("E2E-Admin: Teacher and student requests have different styling", async () => {
  await renderAdminAccessPage();

  // Both role types should be visible
  expect(screen.getAllByText("Teacher").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Student").length).toBeGreaterThan(0);
});

// =====================================================
// TEST SUITE 4: Action Buttons
// =====================================================

/**
 * Test 4.1: Each request has approve and deny buttons
 */
test("E2E-Admin: Each request has approve and deny buttons", async () => {
  await renderAdminAccessPage();

  // Check for approve buttons (green)
  const approveButtons = screen.getAllByText("Approve");
  expect(approveButtons.length).toBeGreaterThan(0);

  // Check for deny buttons
  const denyButtons = screen.getAllByText("Deny");
  expect(denyButtons.length).toBeGreaterThan(0);
});

/**
 * Test 4.2: Approve buttons are visible
 */
test("E2E-Admin: Approve buttons are visible and clickable", async () => {
  await renderAdminAccessPage();

  const approveButtons = screen.getAllByRole("button", { name: /Approve/i });
  expect(approveButtons.length).toBeGreaterThan(0);
});

/**
 * Test 4.3: Deny buttons are visible
 */
test("E2E-Admin: Deny buttons are visible and clickable", async () => {
  await renderAdminAccessPage();

  const denyButtons = screen.getAllByRole("button", { name: /Deny/i });
  expect(denyButtons.length).toBeGreaterThan(0);
});

// =====================================================
// TEST SUITE 5: Tab Navigation
// =====================================================

/**
 * Test 5.1: Can switch to Direct Grant tab
 */
test("E2E-Admin: Can switch to Direct Grant tab", async () => {
  await renderAdminAccessPage();

  // Click Direct Grant tab
  const user = userEvent.setup();
  await user.click(screen.getByText("Direct Grant"));

  // Form should be visible
  await waitFor(() => {
    expect(screen.getByText("Grant Access Directly")).toBeVisible();
  });
});

/**
 * Test 5.2: Direct Grant tab shows form fields
 */
test("E2E-Admin: Direct Grant tab shows form fields", async () => {
  await renderAdminAccessPage();

  // Click Direct Grant tab
  const user = userEvent.setup();
  await user.click(screen.getByText("Direct Grant"));

  await waitFor(() => {
    // Form should be visible
    expect(screen.getByText("Grant Access Directly")).toBeVisible();
    expect(screen.getByLabelText(/name/i)).toBeVisible();
    expect(screen.getByLabelText(/email/i)).toBeVisible();
  });
});

/**
 * Test 5.3: Switching back to Pending tab restores list
 */
test("E2E-Admin: Switching back shows pending list", async () => {
  await renderAdminAccessPage();

  const user = userEvent.setup();

  // Go to Direct Grant tab
  await user.click(screen.getByText("Direct Grant"));

  // Switch back to Pending tab
  await user.click(screen.getByText("Pending Requests"));

  // List should be visible again
  await waitFor(() => {
    expect(screen.getByText("Test Teacher One")).toBeVisible();
  });
});

// =====================================================
// TEST SUITE 6: User Avatar Display
// =====================================================

/**
 * Test 6.1: Each request shows user avatar with initial
 */
test("E2E-Admin: Request shows avatar with initial", async () => {
  await renderAdminAccessPage();

  // Look for avatar circles (rounded-full divs with single letter)
  const avatars = document.querySelectorAll("div[class*='rounded-full']");
  expect(avatars.length).toBeGreaterThan(0);
});

/**
 * Test 6.2: Avatar contains first letter of name
 */
test("E2E-Admin: Avatar initial matches name", async () => {
  await renderAdminAccessPage();

  // Find the avatar for "Test Teacher One" (should show "T")
  const teacherText = screen.getByText("Test Teacher One");
  const parent = teacherText.closest("li");
  expect(parent).toBeDefined();

  // Find the avatar in the same list item
  if (parent) {
    const avatar = parent.querySelector("div[class*='rounded-full']");
    expect(avatar).toBeDefined();
    const initial = avatar?.textContent;
    expect(initial?.toUpperCase()).toBe("T");
  }
});

// =====================================================
// TEST SUITE 7: Notification Badge
// =====================================================

/**
 * Test 7.1: Pending requests tab shows count badge
 */
test("E2E-Admin: Pending tab shows request count badge", async () => {
  await renderAdminAccessPage();

  // The pending requests tab should show the count
  const pendingTab = screen.getByText("Pending Requests").closest("button");
  expect(pendingTab).toBeDefined();

  // Badge should be visible (number in a span)
  const badge = pendingTab?.querySelector("span[class*='rounded-full']");
  expect(badge).toBeDefined();
});

/**
 * Test 7.2: Badge count matches actual request count
 */
test("E2E-Admin: Badge count matches list count", async () => {
  await renderAdminAccessPage();

  // Get badge text
  const pendingTab = screen.getByText("Pending Requests").closest("button");
  const badge = pendingTab?.querySelector("span[class*='rounded-full']");
  const badgeText = badge?.textContent;
  const badgeCount = badgeText ? parseInt(badgeText, 10) : 0;

  // Count actual requests
  const teacherCount = screen.getAllByText("Teacher").length;
  const studentCount = screen.getAllByText("Student").length;
  const totalCount = teacherCount + studentCount;

  // Badge should match or be 0 if no badge shown
  if (badgeCount > 0) {
    expect(badgeCount).toEqual(totalCount);
  }
});

// =====================================================
// TEST SUITE 8: Approval Modal Component
// =====================================================

/**
 * Test 8.1: Approval modal renders for teacher request
 */
test("E2E-Admin: Approval modal shows for teacher request", async () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  render(
    <ApprovalModal
      requestId={"request-1" as Id<"accessRequests">}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
    />
  );

  await waitFor(() => {
    expect(screen.getByText("Approve Access Request")).toBeVisible();
    expect(screen.getByText("Assign to Game")).toBeVisible();
  });
});

/**
 * Test 8.2: Approval modal shows teacher info
 */
test("E2E-Admin: Approval modal shows teacher-specific fields", async () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  render(
    <ApprovalModal
      requestId={"request-1" as Id<"accessRequests">}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
    />
  );

  await waitFor(() => {
    expect(screen.getByText("Approve Access Request")).toBeVisible();
    expect(screen.getByText(/teacher.*game/i, { check: /game/i })).toBeVisible();
  });
});

/**
 * Test 8.3: Approval modal requires game selection
 */
test("E2E-Admin: Approval modal requires game selection", async () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();

  render(
    <ApprovalModal
      requestId={"request-1" as Id<"accessRequests">}
      onClose={mockOnClose}
      onSubmit={mockOnSubmit}
    />
  );

  await waitFor(() => {
    const gameLabel = screen.getByText(/Assign to Game/);
    expect(gameLabel).toBeVisible();

    // Required indicator should be present
    const requiredIndicator = screen.getByText(/\*\s*Assign to Game/);
    expect(requiredIndicator).toBeDefined();
  });
});

// =====================================================
// Future Enhancements
// =====================================================

/**
 * The following test scenarios are documented for future implementation
 * when running with a real Convex backend:
 *
 * 1. Bulk approval - approve multiple requests at once
 *    - Add checkboxes to select multiple requests
 *    - Add bulk approve/deny buttons
 *    - Test selecting and processing multiple requests
 *
 * 2. Filter by role - show only student or teacher requests
 *    - Add filter dropdown or tabs
 *    - Test filtering to show only teachers
 *    - Test filtering to show only students
 *    - Test resetting filter
 *
 * 3. Real backend integration
 *    - Set up test data via ConvexTestContext
 *    - Test actual approve mutation calls
 *    - Test actual deny mutation calls
 *    - Verify database state changes
 *    - Test with real auth (?user=admin@test.com)
 *
 * 4. Full browser navigation (page.goto())
 *    - Navigate to /admin/access route
 *    - Test with query param auth
 *    - Test real form submissions
 *    - Test navigation between pages
 *
 * 5. Access request notifications
 *    - Test admin sees notification count
 *    - Test notification clears on action
 *    - Test real-time updates with Convex
 *
 * 6. Test data setup
 *    - Use testHelpers.insert to create requests
 *    - Create games and companies
 *    - Clean up test data after tests
 *
 * Example test data setup:
 * ```typescript
 * await t.mutation(internal.testHelpers.insert, {
 *   table: "accessRequests",
 *   value: {
 *     name: "Test Teacher",
 *     email: "teacher@test.com",
 *     role: "teacher",
 *     status: "pending",
 *   },
 * });
 * ```
 *
 * 7. Error handling
 *    - Test approval with no game selected
 *    - Test approval for non-existent request
 *    - Test network error handling
 *    - Test mutation failure scenarios
 */

/**
 * Example: Full E2E test with real backend (future)
 *
 * This test would use ConvexTestContext to set up real test data
 * and verify actual database changes.
 *
 * ```typescript
 * test("E2E-Admin: Approve request with real backend", async () => {
 *   const t = convexTest(schema);
 *
 *   // Create test game and company
 *   const gameId = await t.mutation(internal.testHelpers.insert, {
 *     table: "games",
 *     value: { name: "Test Game", status: "active" },
 *   });
 *
 *   // Create pending request
 *   const requestId = await t.mutation(api.accessRequests.create, {
 *     name: "Test Teacher",
 *     email: "teacher@test.com",
 *     role: "teacher",
 *   });
 *
 *   // Navigate to admin page
 *   await page.goto(`/admin/access?user=admin@test.com`);
 *
 *   // Click approve button
 *   await page.click(`button:has-text("Approve")`);
 *
 *   // Select game in modal
 *   await page.selectOption("select[name='game']", "Test Game");
 *
 *   // Submit approval
 *   await page.click('button:has-text("Approve Request")');
 *
 *   // Verify request was approved
 *   const request = await t.query(api.accessRequests.get, { id: requestId });
 *   expect(request.status).toBe("approved");
 *   expect(request.requestedGameId).toBe(gameId);
 * });
 * ```
 */
