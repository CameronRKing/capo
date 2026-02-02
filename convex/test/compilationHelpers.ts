/**
 * Test Helper Functions for Compilation Tests
 * 
 * These functions bypass RLS for testing purposes.
 * NOT FOR PRODUCTION USE.
 */

import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

/**
 * Create a game for testing
 */
export const createGame = mutation({
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
 * Create leadership decisions for testing
 */
export const createLeadershipDecisions = mutation({
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
