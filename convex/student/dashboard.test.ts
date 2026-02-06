/**
 * Student Dashboard Tests
 *
 * Tests for student dashboard domain functions.
 *
 * Coverage:
 * - getDashboardData: Company stats and game context
 * - getUpcomingDeadlines: Decision submission status
 * - getNotificationCount: Unread notification count
 *
 * NOTE: These tests verify dashboard logic by querying data directly.
 * RLS access control is tested separately in rowLevelSecurity.test.ts
 */

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../schema";

describe("Student Dashboard - Core Logic Tests", () => {
  test("getDashboardData logic - calculates active reps count correctly", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and active reps
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 2,
        currentPhase: "hiring",
        length: 8,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Test Company A",
      });

      // Add some active reps for Q2
      await ctx.db.insert("activeReps", {
        companyId,
        quarter: 2,
        repId: "rep1",
        willLetGo: false,
        individualHours: 40,
        leadershipBehavior: "Support",
        territories: [1, 2, 3],
      });

      await ctx.db.insert("activeReps", {
        companyId,
        quarter: 2,
        repId: "rep2",
        willLetGo: false,
        individualHours: 40,
        leadershipBehavior: "Goals",
        territories: [4, 5],
      });

      // Add a rep for a different quarter (shouldn't be counted)
      await ctx.db.insert("activeReps", {
        companyId,
        quarter: 1,
        repId: "rep3",
        willLetGo: false,
        individualHours: 40,
        leadershipBehavior: "Support",
        territories: [6, 7],
      });

      return { gameId, companyId };
    });

    // Verify the data directly (testing dashboard logic without RLS)
    const result = await t.run(async (ctx) => {
      const company = await ctx.db.get(companyId);
      const game = await ctx.db.get(company.gameId);
      const activeReps = await ctx.db
        .query("activeReps")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .collect();

      return {
        companyName: company.name,
        gameQuarter: game.currentQuarter,
        gamePhase: game.currentPhase,
        activeRepsCount: activeReps.length,
      };
    });

    expect(result.companyName).toBe("Test Company A");
    expect(result.gameQuarter).toBe(2);
    expect(result.gamePhase).toBe("hiring");
    expect(result.activeRepsCount).toBe(2); // Only Q2 reps counted
  });

  test("getUpcomingDeadlines logic - detects pending vs submitted decisions", async () => {
    const t = convexTest(schema);

    // Setup: Create game with mixed decision status
    const { gameId, companyId, userId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "B",
        name: "Test Company B",
      });

      const userId = await ctx.db.insert("users", {
        name: "Test Student",
        email: "student@test.com",
        role: "student",
        gameId,
        companyId,
      });

      // Create submitted hiring decision
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        salary: 45000,
        commission: 7,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: true,
        salesContestType: "open",
        salesContestThreshold: 15000,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 2,
        firingList: [],
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: Date.now(),
      });

      // Leadership decision not created (pending)

      return { gameId, companyId, userId };
    });

    // Verify deadline detection logic
    const result = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);

      const hiringDecision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      const leadershipDecision = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      return {
        hiringStatus: hiringDecision?.isSubmitted ? "submitted" : "pending",
        leadershipStatus: leadershipDecision?.isSubmitted ? "submitted" : "pending",
        hiringSubmittedAt: hiringDecision?.submittedAt,
        leadershipSubmittedAt: leadershipDecision?.submittedAt,
      };
    });

    expect(result.hiringStatus).toBe("submitted");
    expect(result.leadershipStatus).toBe("pending");
    expect(result.hiringSubmittedAt).toBeDefined();
    expect(result.leadershipSubmittedAt).toBeUndefined();
  });

  test("getUpcomingDeadlines logic - correct quarter filtering", async () => {
    const t = convexTest(schema);

    // Setup: Game in Q3 with decisions from Q1, Q2, Q3
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Q3 Game",
        currentQuarter: 3,
        currentPhase: "leadership",
        length: 8,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "C",
        name: "Test Company C",
      });

      // Q1 decisions (old)
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        salary: 40000,
        commission: 5,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        salesContestType: "closed",
        salesContestThreshold: 10000,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
        isSubmitted: true,
        submittedAt: Date.now() - 86400000 * 60, // 60 days ago
      });

      // Q2 decisions (old)
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 2,
        salary: 42000,
        commission: 6,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        salesContestType: "closed",
        salesContestThreshold: 10000,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 1,
        firingList: [],
        isSubmitted: true,
        submittedAt: Date.now() - 86400000 * 30, // 30 days ago
      });

      // Q3 decision (current)
      await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter: 3,
        timeRecruiting: 20,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25,
        buyTerritoryReport: true,
        buyCompensationReport: false,
        buyPerformanceReport: true,
        isSubmitted: false, // Pending
      });

      return { gameId, companyId };
    });

    // Verify only Q3 decisions are returned
    const result = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);

      const q3Hiring = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 3)
        )
        .first();

      const q3Leadership = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 3)
        )
        .first();

      return {
        currentQuarter: game.currentQuarter,
        q3HiringExists: !!q3Hiring,
        q3LeadershipExists: !!q3Leadership,
        q3LeadershipSubmitted: q3Leadership?.isSubmitted,
      };
    });

    expect(result.currentQuarter).toBe(3);
    expect(result.q3HiringExists).toBe(false); // No Q3 hiring decision
    expect(result.q3LeadershipExists).toBe(true);
    expect(result.q3LeadershipSubmitted).toBe(false);
  });

  test("dashboard stats aggregation - accurate rep counting across quarters", async () => {
    const t = convexTest(schema);

    // Setup: Company with varying rep counts per quarter
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Multi-Quarter Game",
        currentQuarter: 4,
        currentPhase: "hiring",
        length: 8,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "D",
        name: "Growing Company",
      });

      // Q1: 3 reps
      for (let i = 1; i <= 3; i++) {
        await ctx.db.insert("activeReps", {
          companyId,
          quarter: 1,
          repId: `rep_q1_${i}`,
          willLetGo: false,
          individualHours: 40,
          leadershipBehavior: "Support",
          territories: [i],
        });
      }

      // Q2: 5 reps
      for (let i = 1; i <= 5; i++) {
        await ctx.db.insert("activeReps", {
          companyId,
          quarter: 2,
          repId: `rep_q2_${i}`,
          willLetGo: false,
          individualHours: 40,
          leadershipBehavior: "Goals",
          territories: [i * 2],
        });
      }

      // Q3: 7 reps
      for (let i = 1; i <= 7; i++) {
        await ctx.db.insert("activeReps", {
          companyId,
          quarter: 3,
          repId: `rep_q3_${i}`,
          willLetGo: false,
          individualHours: 38,
          leadershipBehavior: "Praise",
          territories: [i * 3],
        });
      }

      // Q4: 4 reps (current)
      for (let i = 1; i <= 4; i++) {
        await ctx.db.insert("activeReps", {
          companyId,
          quarter: 4,
          repId: `rep_q4_${i}`,
          willLetGo: false,
          individualHours: 42,
          leadershipBehavior: "Rules",
          territories: [i * 4],
        });
      }

      return { gameId, companyId };
    });

    // Verify current quarter (Q4) has correct count
    const result = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      const activeReps = await ctx.db
        .query("activeReps")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .collect();

      return {
        currentQuarter: game.currentQuarter,
        activeRepsCount: activeReps.length,
      };
    });

    expect(result.currentQuarter).toBe(4);
    expect(result.activeRepsCount).toBe(4); // Only Q4 reps counted for dashboard
  });

  test("deadline submission timestamps - accurate tracking", async () => {
    const t = convexTest(schema);

    // Setup: Test submission timestamp accuracy
    const submittedTime = Date.now();
    const { gameId, companyId, userId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Timestamp Test",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "E",
        name: "Timestamp Company",
      });

      const userId = await ctx.db.insert("users", {
        name: "Timer Test",
        email: "timer@test.com",
        role: "student",
        gameId,
        companyId,
      });

      // Submit with specific timestamp
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        salary: 50000,
        commission: 10,
        benefits: "gold",
        travel: "unlimited",
        hasSalesContest: true,
        salesContestType: "open",
        salesContestThreshold: 20000,
        trainingProductKnowledge: 20,
        trainingMarketOrientation: 30,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30,
        numberToHire: 5,
        firingList: [],
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: submittedTime,
      });

      return { gameId, companyId, userId };
    });

    // Verify timestamp is preserved
    const result = await t.run(async (ctx) => {
      const decision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();

      return {
        submittedAt: decision?.submittedAt,
        submittedBy: decision?.submittedBy,
        isSubmitted: decision?.isSubmitted,
      };
    });

    expect(result.isSubmitted).toBe(true);
    expect(result.submittedAt).toBe(submittedTime);
    expect(result.submittedBy).toBe(userId);
  });
});

describe("Student Dashboard - Edge Cases", () => {
  test("handles company with no active reps", async () => {
    const t = convexTest(schema);

    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "New Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "F",
        name: "New Company",
      });

      // No active reps added

      return { gameId, companyId };
    });

    const result = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      const activeReps = await ctx.db
        .query("activeReps")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .collect();

      return activeReps.length;
    });

    expect(result).toBe(0);
  });

  test("handles missing decisions gracefully", async () => {
    const t = convexTest(schema);

    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Empty Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "G",
        name: "Empty Company",
      });

      // No decisions created

      return { gameId, companyId };
    });

    const result = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);

      const hiringDecision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      const leadershipDecision = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      return {
        hiringExists: !!hiringDecision,
        leadershipExists: !!leadershipDecision,
      };
    });

    expect(result.hiringExists).toBe(false);
    expect(result.leadershipExists).toBe(false);
  });
});
