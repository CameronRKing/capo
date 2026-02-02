/**
 * Games Domain Tests
 *
 * Tests for game state and phase queries.
 *
 * NOTE: These tests verify the basic query structure.
 * RLS testing is covered in rowLevelSecurity.test.ts
 */

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";

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

    // Query the game using our domain function
    const game = await t.query(api.games.getGame, { gameId });

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

    // Get current phase
    const phaseInfo = await t.query(api.games.getCurrentPhase, { gameId });

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

    // Check phase status (no decision exists yet)
    const status = await t.query(api.games.getPhaseStatus, {
      gameId,
      companyId,
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

    // Check phase status
    const status = await t.query(api.games.getPhaseStatus, {
      gameId,
      companyId,
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

    // Check phase status (no leadership decision exists yet)
    const status = await t.query(api.games.getPhaseStatus, {
      gameId,
      companyId,
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

    // Check phase status
    const status = await t.query(api.games.getPhaseStatus, {
      gameId,
      companyId,
    });

    expect(status).not.toBeNull();
    expect(status?.isSubmitted).toBe(true);
    expect(status?.submittedBy).toBeDefined();
    expect(status?.submittedAt).toBeDefined();
  });
});
