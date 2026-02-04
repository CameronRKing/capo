import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal Mutations Module
 *
 * Provides internal helper mutations used by actions and other domain functions.
 * These are typically not exposed directly to the frontend.
 */

export const createHiringOutcomeReport = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    oldRepOutcomes: v.array(v.object({
      repId: v.string(),
      outcome: v.union(v.literal("retained"), v.literal("poached")),
    })),
    newRepOutcomes: v.array(v.object({
      repId: v.string(),
      outcome: v.union(v.literal("hired"), v.literal("not_hired")),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hiringOutcomeReports", args);
  },
});

/**
 * Helper: Create a game (for testing)
 */
export const createGame = mutation({
  args: {
    name: v.string(),
    currentQuarter: v.number(),
    currentPhase: v.union(v.literal("hiring"), v.literal("leadership")),
    length: v.number(),
    status: v.union(v.literal("setup"), v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", args);
  },
});

/**
 * Helper: Create a user (for testing)
 */
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
    gameId: v.optional(v.id("games")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

/**
 * Helper: Create a company (for testing)
 */
export const createCompany = mutation({
  args: {
    gameId: v.id("games"),
    industry: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("companies", args);
  },
});

/**
 * Helper: Create a hiring decision (for testing)
 */
export const createHiringDecision = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    salary: v.number(),
    commission: v.number(),
    benefits: v.union(v.literal("bronze"), v.literal("silver"), v.literal("gold")),
    travel: v.union(v.literal("reps_pay_own"), v.literal("monthly_per_diem"), v.literal("unlimited")),
    perDiem: v.optional(v.number()),
    hasSalesContest: v.boolean(),
    salesContestType: v.union(v.literal("open"), v.literal("closed")),
    salesContestThreshold: v.number(),
    trainingProductKnowledge: v.number(),
    trainingMarketOrientation: v.number(),
    trainingCompanyOrientation: v.number(),
    trainingSellingTechniques: v.number(),
    numberToHire: v.number(),
    firingList: v.array(v.id("activeReps")),
    isSubmitted: v.boolean(),
    submittedBy: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hiringDecisions", args);
  },
});

/**
 * Helper: Create a leadership decision (for testing)
 */
export const createLeadershipDecision = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    timeRecruiting: v.number(),
    timeMeetingCustomers: v.number(),
    timeSalesPlanning: v.number(),
    timeAdministrativePaperwork: v.number(),
    buyTerritoryReport: v.boolean(),
    buyCompensationReport: v.boolean(),
    buyPerformanceReport: v.boolean(),
    isSubmitted: v.boolean(),
    submittedBy: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("leadershipDecisions", args);
  },
});

/**
 * Helper: Create a compilation record
 */
export const createCompilationRecord = mutation({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    phase: v.union(v.literal("hiring"), v.literal("leadership")),
    compiledBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("compilations", {
      gameId: args.gameId,
      quarter: args.quarter,
      phase: args.phase,
      status: "pending",
      startedAt: Date.now(),
      compiledBy: args.compiledBy,
      companiesProcessed: 0,
    });
  },
});

/**
 * Helper: Update a compilation record
 */
export const updateCompilationRecord = mutation({
  args: {
    compilationId: v.id("compilations"),
    status: v.union(v.literal("success"), v.literal("failed")),
    companiesProcessed: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.compilationId, {
      status: args.status,
      completedAt: Date.now(),
      companiesProcessed: args.companiesProcessed,
      errorMessage: args.errorMessage,
    });
  },
});
