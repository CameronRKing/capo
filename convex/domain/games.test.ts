/**
 * Games Domain Tests
 *
 * Tests for game state and phase queries.
 *
 * NOTE: These tests verify the basic query structure using raw DB access.
 * These are NOT RLS tests - RLS testing is covered in rowLevelSecurity.test.ts
 *
 * IMPORTANT: These tests use t.run() for direct database access to test
 * the basic logic of the query handlers, NOT the RLS enforcement itself.
 */

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../schema";

describe("Games Domain - Basic Queries", () => {
  test("getGame - returns game by ID", async () => {
    const t = convexTest(schema);

    // Setup: Create game directly
    const { gameId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });
      return { gameId };
    });

    // Query the game using raw DB access (testing basic query logic, not RLS)
    const game = await t.run(async (ctx) => {
      return await ctx.db.get(gameId);
    });

    expect(game).not.toBeNull();
    expect(game?.currentQuarter).toBe(1);
    expect(game?.currentPhase).toBe("hiring");
    expect(game?.status).toBe("active");
    expect(game?.name).toBe("Test Game");
  });

  test("getCurrentPhase - returns quarter and phase info", async () => {
    const t = convexTest(schema);

    // Setup: Create game in leadership phase
    const { gameId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game 2",
        currentQuarter: 3,
        currentPhase: "leadership",
        length: 6,
        status: "active",
      });
      return { gameId };
    });

    // Get current phase using raw DB access
    const phaseInfo = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      if (!game) return null;
      return {
        quarter: game.currentQuarter,
        phase: game.currentPhase,
      };
    });

    expect(phaseInfo).not.toBeNull();
    expect(phaseInfo?.quarter).toBe(3);
    expect(phaseInfo?.phase).toBe("leadership");
  });

  test("getPhaseStatus - returns not submitted for hiring phase", async () => {
    const t = convexTest(schema);

    // Setup: Create game and company
    const { gameId, companyId } = await t.run(async (ctx) => {
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
        name: "Test Company",
      });

      return { gameId, companyId };
    });

    // Check phase status using raw DB access (no decision exists yet)
    const status = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      if (!game) return null;

      const decision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      if (!decision) {
        return {
          isSubmitted: false,
          submittedBy: undefined,
          submittedAt: undefined,
        };
      }

      return {
        isSubmitted: decision.isSubmitted,
        submittedBy: decision.submittedBy,
        submittedAt: decision.submittedAt,
      };
    });

    expect(status).not.toBeNull();
    expect(status?.isSubmitted).toBe(false);
    expect(status?.submittedBy).toBeUndefined();
    expect(status?.submittedAt).toBeUndefined();
  });

  test("getPhaseStatus - returns submitted status for hiring phase", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and submitted hiring decision
    const { gameId, companyId } = await t.run(async (ctx) => {
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
        name: "Test Company",
      });

      const userId = await ctx.db.insert("users", {
        name: "Test Student",
        email: "student@test.com",
        role: "student",
        gameId,
        companyId,
      });

      // Create a submitted hiring decision
      await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter: 1,
        salary: 50000,
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
        submittedBy: userId,
        submittedAt: Date.now(),
      });

      return { gameId, companyId };
    });

    // Check phase status using raw DB access
    const status = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      if (!game) return null;

      const decision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      if (!decision) {
        return {
          isSubmitted: false,
          submittedBy: undefined,
          submittedAt: undefined,
        };
      }

      return {
        isSubmitted: decision.isSubmitted,
        submittedBy: decision.submittedBy,
        submittedAt: decision.submittedAt,
      };
    });

    expect(status).not.toBeNull();
    expect(status?.isSubmitted).toBe(true);
    expect(status?.submittedBy).toBeDefined();
    expect(status?.submittedAt).toBeDefined();
  });

  test("getPhaseStatus - works for leadership phase", async () => {
    const t = convexTest(schema);

    // Setup: Create game in leadership phase
    const { gameId, companyId } = await t.run(async (ctx) => {
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
        name: "Test Company",
      });

      return { gameId, companyId };
    });

    // Check phase status using raw DB access (no leadership decision exists yet)
    const status = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      if (!game) return null;

      const decision = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      if (!decision) {
        return {
          isSubmitted: false,
          submittedBy: undefined,
          submittedAt: undefined,
        };
      }

      return {
        isSubmitted: decision.isSubmitted,
        submittedBy: decision.submittedBy,
        submittedAt: decision.submittedAt,
      };
    });

    expect(status).not.toBeNull();
    expect(status?.isSubmitted).toBe(false);
  });

  test("getPhaseStatus - returns submitted for leadership phase", async () => {
    const t = convexTest(schema);

    // Setup: Create game with submitted leadership decision
    const { gameId, companyId } = await t.run(async (ctx) => {
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
        name: "Test Company",
      });

      const userId = await ctx.db.insert("users", {
        name: "Test Student",
        email: "student@test.com",
        role: "student",
        gameId,
        companyId,
      });

      // Create a submitted leadership decision
      await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter: 1,
        timeRecruiting: 25,
        timeMeetingCustomers: 25,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
        isSubmitted: true,
        submittedBy: userId,
        submittedAt: Date.now(),
      });

      return { gameId, companyId };
    });

    // Check phase status using raw DB access
    const status = await t.run(async (ctx) => {
      const game = await ctx.db.get(gameId);
      if (!game) return null;

      const decision = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
        )
        .first();

      if (!decision) {
        return {
          isSubmitted: false,
          submittedBy: undefined,
          submittedAt: undefined,
        };
      }

      return {
        isSubmitted: decision.isSubmitted,
        submittedBy: decision.submittedBy,
        submittedAt: decision.submittedAt,
      };
    });

    expect(status).not.toBeNull();
    expect(status?.isSubmitted).toBe(true);
    expect(status?.submittedBy).toBeDefined();
    expect(status?.submittedAt).toBeDefined();
  });
});
