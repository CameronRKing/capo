import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal Domain Module
 * 
 * Provides internal helper functions used by actions and other domain functions.
 * These are typically not exposed directly to the frontend.
 */

export const listGameCompanies = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    return companies;
  },
});

export const listActiveRepsByCompanyQuarter = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const reps = await ctx.db
      .query("activeReps")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .collect();

    return reps;
  },
});

export const getLeadershipDecisions = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const decisions = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return decisions;
  },
});

export const getOrCreateDefaultLeadershipDecisions = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Try to get existing decisions
    const existing = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (existing) {
      return existing;
    }

    // Return default decisions (not inserted, just returned)
    return {
      companyId,
      quarter,
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
      isSubmitted: false,
    };
  },
});

export const createDefaultLeadershipDecisions = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Check if already exists
    const existing = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Create default decisions
    const id = await ctx.db.insert("leadershipDecisions", {
      companyId,
      quarter,
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: false,
      buyCompensationReport: false,
      buyPerformanceReport: false,
      isSubmitted: false,
    });

    return id;
  },
});

export const getHiringOutcomeReport = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    return await ctx.db
      .query("hiringOutcomeReports")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();
  },
});
