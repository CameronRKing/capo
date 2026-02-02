/**
 * Test mutations for integration testing
 *
 * These mutations are ONLY used in integration tests to set up test data.
 * They should NOT be used in production code.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Test helper: Create a game
 */
export const create = mutation({
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
 * Test helper: Create a company
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
 * Test helper: Create a user
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
 * Test helper: Create hiring decisions
 */
export const createHiringDecisions = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    salary: v.number(),
    commission: v.number(),
    benefits: v.union(v.literal("bronze"), v.literal("silver"), v.literal("gold")),
    travel: v.union(v.literal("reps_pay_own"), v.literal("monthly_per_diem"), v.literal("unlimited")),
    perDiem: v.optional(v.number()),
    hasSalesContest: v.boolean(),
    salesContestType: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    salesContestThreshold: v.optional(v.number()),
    trainingProductKnowledge: v.number(),
    trainingMarketOrientation: v.number(),
    trainingCompanyOrientation: v.number(),
    trainingSellingTechniques: v.number(),
    numberToHire: v.number(),
    firingList: v.array(v.id("activeReps")),
    isSubmitted: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hiringDecisions", args);
  },
});

/**
 * Test helper: Create hiring list
 */
export const createHiringList = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    repIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("hiringLists", args);
  },
});

/**
 * Test helper: Create active rep
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
 * Test helper: Create a game (simplified)
 */
export const createGame = mutation({
  args: {
    name: v.string(),
    length: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("games", {
      name: args.name,
      currentQuarter: 1,
      currentPhase: "hiring",
      length: args.length,
      status: "active",
    });
  },
});
