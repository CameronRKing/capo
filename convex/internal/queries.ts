import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal Queries Module
 *
 * Provides internal helper queries used by actions and other domain functions.
 * These are typically not exposed directly to the frontend.
 */

export const listGameCompanies = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();
  },
});

export const getHiringDecision = query({
  args: { companyId: v.id("companies"), quarter: v.number() },
  handler: async (ctx, { companyId, quarter }) => {
    return await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();
  },
});

export const getHiringList = query({
  args: { companyId: v.id("companies"), quarter: v.number() },
  handler: async (ctx, { companyId, quarter }) => {
    const list = await ctx.db
      .query("hiringLists")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();
    return list?.repIds ?? [];
  },
});

export const getActiveReps = query({
  args: { companyId: v.id("companies"), quarter: v.number() },
  handler: async (ctx, { companyId, quarter }) => {
    return await ctx.db
      .query("activeReps")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .collect();
  },
});
