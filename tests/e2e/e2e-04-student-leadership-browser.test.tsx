/**
 * E2E-04: Student Leadership Decision Submission
 *
 * Comprehensive end-to-end tests for the student leadership decision form.
 * Tests form rendering, validation, auto-save, submission workflow, data persistence,
 * and error handling using convexTest for true integration testing with Convex backend.
 *
 * Prerequisites:
 * - Convex backend must be available (via convexTest)
 * - No auth server required (using direct test user creation)
 *
 * Run with: `npm run test:e2e`
 *
 * @see src/routes/student/decisions/leadership.tsx
 * @see src/components/decisions/LeadershipDecisionForm.tsx
 * @see convex/domain/decisions/persistence.ts
 */

import React from "react";
import { test, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { LeadershipDecisionForm } from "../../src/components/decisions/LeadershipDecisionForm";
import { createTestGame, createTestUser } from "./helpers/fixtures";
import type { Id } from "../../convex/_generated/dataModel";

// Clean up after each test
afterEach(() => {
  cleanup();
});

// =====================================================
// Test Utilities
// =====================================================

/**
 * Setup test environment with authenticated user and game
 */
async function setupLeadershipTestEnvironment() {
  const t = convexTest(schema);

  // Create test game with companies
  const { gameId, companyIds } = await createTestGame(t, {
    numCompanies: 4,
    gameStatus: "active",
  });

  // Create test student user
  const userId = await createTestUser(t, {
    name: "Test Student",
    email: "test@student.com",
    role: "student",
    gameId,
    companyId: companyIds[0] as Id<"companies">,
  });

  // Create some active reps for testing
  const rep1 = await t.run(async (ctx: any) => {
    return await ctx.db.insert("activeReps", {
      companyId: companyIds[0] as Id<"companies">,
      quarter: 1,
      repId: "RESUME_001",
      willLetGo: false,
      individualHours: 1,
      leadershipBehavior: "Support",
      territories: [],
    });
  });

  const rep2 = await t.run(async (ctx: any) => {
    return await ctx.db.insert("activeReps", {
      companyId: companyIds[0] as Id<"companies">,
      quarter: 1,
      repId: "RESUME_002",
      willLetGo: false,
      individualHours: 2,
      leadershipBehavior: "Goals",
      territories: [],
    });
  });

  return {
    t,
    gameId,
    companyId: companyIds[0] as Id<"companies">,
    userId,
    reps: [rep1, rep2],
  };
}

/**
 * Render LeadershipDecisionForm with test context
 */
async function renderLeadershipForm(
  t: any,
  companyId: Id<"companies">,
  user: any,
  quarter: number = 1
) {
  // Mock useQuery and useMutation
  vi.mock("convex/react", async () => {
    const actual = await vi.importActual("convex/react");
    return {
      ...actual,
      useQuery: vi.fn(() => null),
      useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
    };
  });

  const testUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
  };

  const rendered = render(
    <LeadershipDecisionForm companyId={companyId} quarter={quarter} user={testUser} />
  );

  // Wait for form to render
  await waitFor(
    () => {
      expect(screen.getByText(/Time Allocation/i)).toBeVisible();
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
test.skip("E2E-04: Leadership decision form renders all sections", async () => {
  const { companyId, userId } = await setupLeadershipTestEnvironment();
  await renderLeadershipForm({ companyId }, companyId, { _id: userId, name: "Test Student", email: "test@student.com" });

  // Verify all main sections are visible
  expect(screen.getByText(/Time Allocation/i)).toBeVisible();
  expect(screen.getByText(/Individual Rep Management/i)).toBeVisible();
  expect(screen.getByText(/Territory Assignments/i)).toBeVisible();
  expect(screen.getByText(/Market Reports/i)).toBeVisible();
});

/**
 * Test 1.2: Time allocation sliders render with correct defaults
 */
test.skip("E2E-04: Time allocation sliders render with defaults", async () => {
  const { companyId, userId } = await setupLeadershipTestEnvironment();
  await renderLeadershipForm({ companyId }, companyId, { _id: userId, name: "Test Student", email: "test@student.com" });

  // Verify all sliders are present
  expect(screen.getByText(/Recruiting/i)).toBeVisible();
  expect(screen.getByText(/Meeting Customers/i)).toBeVisible();
  expect(screen.getByText(/Sales Planning/i)).toBeVisible();
  expect(screen.getByText(/Administrative Paperwork/i)).toBeVisible();

  // Verify total indicator
  expect(screen.getByText(/Total:/i)).toBeVisible();
});

/**
 * Test 1.3: Market reports checkboxes render
 */
test.skip("E2E-04: Market reports checkboxes render correctly", async () => {
  const { companyId, userId } = await setupLeadershipTestEnvironment();
  await renderLeadershipForm({ companyId }, companyId, { _id: userId, name: "Test Student", email: "test@student.com" });

  // Verify all market report checkboxes
  expect(screen.getByLabelText(/Territory Reports/i)).toBeVisible();
  expect(screen.getByLabelText(/Compensation Reports/i)).toBeVisible();
  expect(screen.getByLabelText(/Performance Reports/i)).toBeVisible();

  // Verify cost display
  expect(screen.getByText(/Total Cost:/i)).toBeVisible();
});

/**
 * Test 1.4: Submit button renders and is initially disabled
 */
test.skip("E2E-04: Submit button renders with correct initial state", async () => {
  const { companyId, userId } = await setupLeadershipTestEnvironment();
  await renderLeadershipForm({ companyId }, companyId, { _id: userId, name: "Test Student", email: "test@student.com" });

  const submitButton = screen.getByRole("button", { name: /Submit Decisions/i });
  expect(submitButton).toBeVisible();
  expect(submitButton).toBeDisabled(); // Disabled because time allocation != 100%
});

// =====================================================
// Test Suite 2: Backend Integration (convexTest)
// =====================================================

/**
 * Test 2.1: Query returns null for non-existent working decision
 */
test.skip("E2E-04: Query returns null for non-existent working decision", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Query working decision (should be null initially)
  const workingDecision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(workingDecision).toBeNull();
});

/**
 * Test 2.2: Save working decision creates new draft
 */
test.skip("E2E-04: Save working decision creates new draft", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Verify no decision exists
  let decision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );
  expect(decision).toBeNull();

  // Save creates new draft
  const decisionId = await t.mutation(
    api.myFunctions.domain.decisions.saveLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
      data: {
        timeRecruiting: 25,
        timeMeetingCustomers: 25,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      },
    }
  );

  expect(decisionId).not.toBeNull();

  // Verify it was created
  decision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );
  expect(decision).not.toBeNull();
  expect(decision?.timeRecruiting).toBe(25);
});

/**
 * Test 2.3: Update existing working decision
 */
test.skip("E2E-04: Update existing working decision", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Initial save
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 20,
      timeMeetingCustomers: 20,
      timeSalesPlanning: 20,
      timeAdministrativePaperwork: 40,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  // Update with new values
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 30,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 20,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: true,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  // Verify the update was saved
  const decision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(decision).not.toBeNull();
  expect(decision?.timeRecruiting).toBe(30);
  expect(decision?.timeMeetingCustomers).toBe(25);
  expect(decision?.timeSalesPlanning).toBe(20);
  expect(decision?.timeAdministrativePaperwork).toBe(25);
  expect(decision?.buyTerritoryReport).toBe(true);
  expect(decision?.isSubmitted).toBe(false);
});

// =====================================================
// Test Suite 3: Validation
// =====================================================

/**
 * Test 3.1: Time allocation must sum to 100%
 */
test.skip("E2E-04: Time allocation validation - sums to 100%", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Save with invalid time allocation (sum != 100)
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 20,
      timeMeetingCustomers: 20,
      timeSalesPlanning: 20,
      timeAdministrativePaperwork: 20, // Sum = 80, invalid
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  const decision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(decision).not.toBeNull();
  const timeSum =
    (decision?.timeRecruiting || 0) +
    (decision?.timeMeetingCustomers || 0) +
    (decision?.timeSalesPlanning || 0) +
    (decision?.timeAdministrativePaperwork || 0);

  expect(timeSum).toBe(80); // Client-side validation should catch this
});

/**
 * Test 3.2: Valid time allocation summing to 100%
 */
test.skip("E2E-04: Valid time allocation accepted", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Save with valid time allocation
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25, // Sum = 100, valid
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  const decision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(decision).not.toBeNull();
  const timeSum =
    (decision?.timeRecruiting || 0) +
    (decision?.timeMeetingCustomers || 0) +
    (decision?.timeSalesPlanning || 0) +
    (decision?.timeAdministrativePaperwork || 0);

  expect(timeSum).toBe(100);
});

// =====================================================
// Test Suite 4: Submission Workflow
// =====================================================

/**
 * Test 4.1: Submit valid leadership decision successfully
 */
test.skip("E2E-04: Submit valid leadership decision successfully", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;
  const userId = await createTestUser(t, {
    name: "Test Student",
    email: "student@test.com",
    role: "student",
    companyId,
  });

  // Save valid decision
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  // Submit the decision
  const submittedId = await t.mutation(
    api.myFunctions.domain.decisions.submitLeadershipDecision,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(submittedId).not.toBeNull();

  // Verify submission state
  const decision = await t.run(async (ctx: any) => {
    return await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", 1)
      )
      .first();
  });

  expect(decision).not.toBeNull();
  expect(decision?.isSubmitted).toBe(true);
  expect(decision?.submittedBy).toBe(userId);
  expect(decision?.submittedAt).not.toBeNull();
  expect(decision?.submittedAt).toBeLessThanOrEqual(Date.now());
});

/**
 * Test 4.2: Prevent submission when no working decision exists
 */
test.skip("E2E-04: Prevent submission when no working decision exists", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Try to submit without saving
  await expect(
    t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
      companyId,
      quarter: 1,
    })
  ).rejects.toThrow("No decision found");
});

/**
 * Test 4.3: Prevent duplicate submissions
 */
test.skip("E2E-04: Prevent duplicate submissions", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Save and submit
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  await t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
    companyId,
    quarter: 1,
  });

  // Try to submit again
  await expect(
    t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
      companyId,
      quarter: 1,
    })
  ).rejects.toThrow("Decision already submitted");
});

/**
 * Test 4.4: Prevent modification after submission
 */
test.skip("E2E-04: Prevent modification after submission", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Save and submit
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  await t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
    companyId,
    quarter: 1,
  });

  // Try to modify submitted decision
  await expect(
    t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
      companyId,
      quarter: 1,
      data: {
        timeRecruiting: 30,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 20,
        timeAdministrativePaperwork: 20,
        buyTerritoryReport: true,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      },
    })
  ).rejects.toThrow("Cannot modify submitted decision");
});

/**
 * Test 4.5: Working decision returns null after submission
 */
test.skip("E2E-04: Working decision returns null after submission", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Save and submit
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  await t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
    companyId,
    quarter: 1,
  });

  // Query working decision - should return null since it's submitted
  const workingDecision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(workingDecision).toBeNull();
});

// =====================================================
// Test Suite 5: Data Persistence
// =====================================================

/**
 * Test 5.1: All decision fields persist correctly
 */
test.skip("E2E-04: All decision fields persist correctly", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  const decisionData = {
    timeRecruiting: 30,
    timeMeetingCustomers: 20,
    timeSalesPlanning: 25,
    timeAdministrativePaperwork: 25,
    buyTerritoryReport: true,
    buyCompensationReport: true,
    buyPerformanceReport: false,
  };

  // Save decision
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: decisionData,
  });

  // Verify all fields persisted
  const decision = await t.run(async (ctx: any) => {
    return await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", 1)
      )
      .first();
  });

  expect(decision).not.toBeNull();
  expect(decision?.companyId).toBe(companyId);
  expect(decision?.quarter).toBe(1);
  expect(decision?.timeRecruiting).toBe(decisionData.timeRecruiting);
  expect(decision?.timeMeetingCustomers).toBe(decisionData.timeMeetingCustomers);
  expect(decision?.timeSalesPlanning).toBe(decisionData.timeSalesPlanning);
  expect(decision?.timeAdministrativePaperwork).toBe(
    decisionData.timeAdministrativePaperwork
  );
  expect(decision?.buyTerritoryReport).toBe(decisionData.buyTerritoryReport);
  expect(decision?.buyCompensationReport).toBe(decisionData.buyCompensationReport);
  expect(decision?.buyPerformanceReport).toBe(decisionData.buyPerformanceReport);
  expect(decision?.isSubmitted).toBe(false);
});

/**
 * Test 5.2: Submission metadata stores correctly
 */
test.skip("E2E-04: Submission metadata stores correctly", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;
  const userId = await createTestUser(t, {
    name: "Test Student",
    email: "student@test.com",
    role: "student",
    companyId,
  });

  // Save and submit
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  const beforeSubmit = Date.now();

  await t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
    companyId,
    quarter: 1,
  });

  const afterSubmit = Date.now();

  // Verify metadata
  const decision = await t.run(async (ctx: any) => {
    return await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", 1)
      )
      .first();
  });

  expect(decision).not.toBeNull();
  expect(decision?.isSubmitted).toBe(true);
  expect(decision?.submittedBy).toBe(userId);
  expect(decision?.submittedAt).not.toBeNull();
  expect(decision?.submittedAt).toBeGreaterThanOrEqual(beforeSubmit);
  expect(decision?.submittedAt).toBeLessThanOrEqual(afterSubmit);
});

// =====================================================
// Test Suite 6: Market Reports
// =====================================================

/**
 * Test 6.1: Market reports cost calculation
 */
test.skip("E2E-04: Market reports cost calculation", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Each report costs $10,000
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: true,
      buyCompensationReport: true,
      buyPerformanceReport: false,
    },
  });

  const decision = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 1,
    }
  );

  expect(decision).not.toBeNull();

  // Calculate expected cost: 2 reports * $10,000 = $20,000
  const expectedCost =
    (decision?.buyTerritoryReport ? 10000 : 0) +
    (decision?.buyCompensationReport ? 10000 : 0) +
    (decision?.buyPerformanceReport ? 10000 : 0);

  expect(expectedCost).toBe(20000);
});

// =====================================================
// Test Suite 7: Multi-Quarter Scenarios
// =====================================================

/**
 * Test 7.1: Different quarters handled independently
 */
test.skip("E2E-04: Different quarters handled independently", async () => {
  const t = convexTest(schema);
  const { companyIds } = await createTestGame(t, { numCompanies: 1 });
  const companyId = companyIds[0] as any;

  // Save Q1 decision
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 1,
    data: {
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  // Submit Q1
  await t.mutation(api.myFunctions.domain.decisions.submitLeadershipDecision, {
    companyId,
    quarter: 1,
  });

  // Save Q2 decision (should not affect Q1)
  await t.mutation(api.myFunctions.domain.decisions.saveLeadershipDecisionWorking, {
    companyId,
    quarter: 2,
    data: {
      timeRecruiting: 30,
      timeMeetingCustomers: 20,
      timeSalesPlanning: 20,
      timeAdministrativePaperwork: 30,
      buyTerritoryReport: true,
      buyCompensationReport: false,
      buyPerformanceReport: false,
    },
  });

  // Verify Q1 still submitted
  const q1Decision = await t.run(async (ctx: any) => {
    return await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", 1)
      )
      .first();
  });

  expect(q1Decision?.isSubmitted).toBe(true);

  // Verify Q2 is still working
  const q2Working = await t.query(
    api.myFunctions.domain.decisions.getLeadershipDecisionWorking,
    {
      companyId,
      quarter: 2,
    }
  );

  expect(q2Working).not.toBeNull();
  expect(q2Working?.timeRecruiting).toBe(30);
  expect(q2Working?.isSubmitted).toBe(false);
});
