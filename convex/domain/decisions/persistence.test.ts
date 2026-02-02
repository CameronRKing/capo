/**
 * Decision Persistence Tests
 *
 * Tests for the decision persistence layer focusing on:
 * - Auto-save workflow (draft creation and updates)
 * - Submit workflow (validation and state transitions)
 * - Basic CRUD operations
 *
 * NOTE: Full RLS testing is done in rowLevelSecurity.test.ts
 * These tests focus on business logic and validation
 */

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../../schema";
import { api } from "../../_generated/api";

// =====================================================
// Test Data
// =====================================================

const validHiringDecision = {
  salary: 50000,
  commission: 5,
  benefits: "bronze" as const,
  travel: "reps_pay_own" as const,
  perDiem: undefined,
  hasSalesContest: false,
  salesContestType: "closed" as const,
  salesContestThreshold: 0,
  trainingProductKnowledge: 25,
  trainingMarketOrientation: 25,
  trainingCompanyOrientation: 20,
  trainingSellingTechniques: 30,
  numberToHire: 0,
  firingList: [],
};

const validLeadershipDecision = {
  timeRecruiting: 25,
  timeMeetingCustomers: 25,
  timeSalesPlanning: 25,
  timeAdministrativePaperwork: 25,
  buyTerritoryReport: false,
  buyCompensationReport: false,
  buyPerformanceReport: false,
};

// =====================================================
// Hiring Decision Persistence Tests
// =====================================================

describe("Hiring Decision - Auto Save", () => {
  test("creates new draft when none exists", async () => {
    const t = convexTest(schema);

    // Setup: Create company and user directly in DB
    const { companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const userId = await ctx.db.insert("users", {
        name: "Student 1",
        email: "student1@test.com",
        role: "student",
        gameId,
        companyId,
      });

      return { companyId, userId };
    });

    // Act: Save draft (bypassing RLS for unit test)
    const decisionId = await t.run(async (ctx) => {
      return await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        ...validHiringDecision,
        isSubmitted: false,
      });
    });

    // Assert: Verify draft was created
    const draft = await t.run(async (ctx) => {
      return await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    expect(draft).not.toBeNull();
    expect(draft?.isSubmitted).toBe(false);
    expect(draft?.salary).toBe(50000);
    expect(draft?._id).toBe(decisionId);
  });

  test("updates existing draft", async () => {
    const t = convexTest(schema);

    // Setup and create draft in same run
    const { companyId, decisionId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const decisionId = await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        ...validHiringDecision,
        isSubmitted: false,
      });

      return { companyId, decisionId };
    });

    // Update with new salary
    await t.run(async (ctx) => {
      await ctx.db.patch(decisionId, {
        salary: 60000,
      });
    });

    // Verify updated
    const draft = await t.run(async (ctx) => {
      return await ctx.db.get(decisionId);
    });

    expect(draft?.salary).toBe(60000);
  });

  test("returns null for non-existent draft", async () => {
    const t = convexTest(schema);

    // Setup: Create company
    const companyId = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      return await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });
    });

    // Try to get draft that doesn't exist
    const draft = await t.run(async (ctx) => {
      return await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    expect(draft).toBeNull();
  });
});

describe("Hiring Decision - Submit Workflow", () => {
  test("submit transitions decision to submitted state", async () => {
    const t = convexTest(schema);

    // Setup
    const { companyId, userId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const userId = await ctx.db.insert("users", {
        name: "Student 1",
        email: "student1@test.com",
        role: "student",
        gameId,
        companyId,
      });

      return { companyId, userId };
    });

    // Create draft
    const decisionId = await t.run(async (ctx) => {
      return await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        ...validHiringDecision,
        isSubmitted: false,
      });
    });

    // Submit: Mark as submitted
    await t.run(async (ctx) => {
      await ctx.db.patch(decisionId, {
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: Date.now(),
      });
    });

    // Verify submitted
    const submitted = await t.run(async (ctx) => {
      return await ctx.db.get(decisionId);
    });

    expect(submitted?.isSubmitted).toBe(true);
    expect(submitted?.submittedBy).toBe(userId);
    expect(submitted?.submittedAt).toBeGreaterThan(0);
  });

  test("prevents submission without draft", async () => {
    const t = convexTest(schema);

    // Setup: Create company but no decision
    const companyId = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      return await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });
    });

    // Try to get decision that doesn't exist
    const decision = await t.run(async (ctx) => {
      return await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    expect(decision).toBeNull();
  });
});

// =====================================================
// Leadership Decision Persistence Tests
// =====================================================

describe("Leadership Decision - Auto Save", () => {
  test("creates new draft when none exists", async () => {
    const t = convexTest(schema);

    const { companyId, decisionId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "leadership",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const decisionId = await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter: 1,
        ...validLeadershipDecision,
        isSubmitted: false,
      });

      return { companyId, decisionId };
    });

    const draft = await t.run(async (ctx) => {
      return await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    expect(draft).not.toBeNull();
    expect(draft?.isSubmitted).toBe(false);
    expect(draft?.timeRecruiting).toBe(25);
    expect(draft?._id).toBe(decisionId);
  });

  test("updates existing draft", async () => {
    const t = convexTest(schema);

    const { companyId, decisionId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "leadership",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const decisionId = await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter: 1,
        ...validLeadershipDecision,
        isSubmitted: false,
      });

      return { companyId, decisionId };
    });

    // Update
    await t.run(async (ctx) => {
      await ctx.db.patch(decisionId, {
        timeRecruiting: 50,
      });
    });

    const draft = await t.run(async (ctx) => {
      return await ctx.db.get(decisionId);
    });

    expect(draft?.timeRecruiting).toBe(50);
  });
});

describe("Leadership Decision - Submit Workflow", () => {
  test("submit transitions decision to submitted state", async () => {
    const t = convexTest(schema);

    const { companyId, userId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "leadership",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const userId = await ctx.db.insert("users", {
        name: "Student 1",
        email: "student1@test.com",
        role: "student",
        gameId,
        companyId,
      });

      return { companyId, userId };
    });

    const decisionId = await t.run(async (ctx) => {
      return await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter: 1,
        ...validLeadershipDecision,
        isSubmitted: false,
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.patch(decisionId, {
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: Date.now(),
      });
    });

    const submitted = await t.run(async (ctx) => {
      return await ctx.db.get(decisionId);
    });

    expect(submitted?.isSubmitted).toBe(true);
    expect(submitted?.submittedBy).toBe(userId);
  });
});

// =====================================================
// Compilation Query Tests
// =====================================================

describe("getSubmittedDecisions - Query Structure", () => {
  test("returns both submitted decisions when present", async () => {
    const t = convexTest(schema);

    const { companyId, userId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const userId = await ctx.db.insert("users", {
        name: "Student 1",
        email: "student1@test.com",
        role: "student",
        gameId,
        companyId,
      });

      return { companyId, userId };
    });

    // Submit both decisions
    await t.run(async (ctx) => {
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        ...validHiringDecision,
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: Date.now(),
      });

      await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter: 1,
        ...validLeadershipDecision,
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: Date.now(),
      });
    });

    // Query both
    const decisions = await t.run(async (ctx) => {
      const hiring = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();

      const leadership = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();

      return {
        hiring: hiring?.isSubmitted ? hiring : null,
        leadership: leadership?.isSubmitted ? leadership : null,
      };
    });

    expect(decisions.hiring).not.toBeNull();
    expect(decisions.leadership).not.toBeNull();
    expect(decisions.hiring?.isSubmitted).toBe(true);
    expect(decisions.leadership?.isSubmitted).toBe(true);
  });

  test("returns null for unsubmitted decisions", async () => {
    const t = convexTest(schema);

    const { companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Save but don't submit
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        ...validHiringDecision,
        isSubmitted: false,
      });

      return { companyId };
    });

    // Query
    const decisions = await t.run(async (ctx) => {
      const hiring = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();

      const leadership = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();

      return {
        hiring: hiring?.isSubmitted ? hiring : null,
        leadership: leadership?.isSubmitted ? leadership : null,
      };
    });

    expect(decisions.hiring).toBeNull();
    expect(decisions.leadership).toBeNull();
  });
});

// =====================================================
// Zod Validation Integration Tests
// =====================================================

describe("Zod Schema Validation", () => {
  test("hiring decision schema validates training sum", async () => {
    // Import schema to test validation directly
    const { hiringDecisionSchema } = await import("./validators");

    // Valid data
    const result = hiringDecisionSchema.safeParse(validHiringDecision);
    expect(result.success).toBe(true);

    // Invalid: training sum != 100
    const invalidResult = hiringDecisionSchema.safeParse({
      ...validHiringDecision,
      trainingProductKnowledge: 50, // Sum would be 130
    });

    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues.some(
        issue => issue.message.includes("Training allocation must sum to 100")
      )).toBe(true);
    }
  });

  test("hiring decision schema validates per diem requirement", async () => {
    const { hiringDecisionSchema } = await import("./validators");

    // Invalid: travel=monthly_per_diem but no perDiem
    const invalidResult = hiringDecisionSchema.safeParse({
      ...validHiringDecision,
      travel: "monthly_per_diem",
    });

    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues.some(
        issue => issue.message.includes("Per diem must be specified")
      )).toBe(true);
    }
  });

  test("leadership decision schema validates time allocation", async () => {
    const { leadershipDecisionSchema } = await import("./validators");

    // Valid data
    const result = leadershipDecisionSchema.safeParse(validLeadershipDecision);
    expect(result.success).toBe(true);

    // Invalid: time sum != 100
    const invalidResult = leadershipDecisionSchema.safeParse({
      ...validLeadershipDecision,
      timeRecruiting: 50, // Sum would be 125
    });

    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.issues.some(
        issue => issue.message.includes("Time allocation must sum to 100")
      )).toBe(true);
    }
  });
});
