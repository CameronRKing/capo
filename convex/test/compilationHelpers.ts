/**
 * Test Helper Functions for Compilation Tests
 *
 * These functions bypass RLS for testing purposes.
 * NOT FOR PRODUCTION USE.
 */

import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Create a user for testing
 */
export const seedUser = mutation({
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
 * Create a game for testing
 */
export const seedGame = mutation({
  args: {
    name: v.string(),
    length: v.number(),
    currentQuarter: v.number(),
    currentPhase: v.union(v.literal("hiring"), v.literal("leadership")),
    status: v.union(v.literal("setup"), v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", args);
  },
});

/**
 * Create a company for testing
 */
export const seedCompany = mutation({
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
 * Create hiring decisions for testing
 */
export const seedHiringDecision = mutation({
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
 * Create leadership decisions for testing
 */
export const seedLeadershipDecision = mutation({
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
 * Create active rep for testing
 */
export const createActiveRep = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    repId: v.string(),
    willLetGo: v.boolean(),
    individualHours: v.number(),
    leadershipBehavior: v.union(
      v.literal("Praise"),
      v.literal("Punishment"),
      v.literal("Rules"),
      v.literal("Goals"),
      v.literal("Support")
    ),
    territories: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activeReps", args);
  },
});

/**
 * Patch user for testing
 */
export const patchUser = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      gameId: v.optional(v.id("games")),
      companyId: v.optional(v.id("companies")),
    }),
  },
  handler: async (ctx, { userId, updates }) => {
    return await ctx.db.patch(userId, updates);
  },
});
