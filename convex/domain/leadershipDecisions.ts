/**
 * Leadership Decisions Domain Module
 *
 * Functions for managing leadership decision submissions.
 */

import { v } from "convex/values";
import { queryWithRLS, mutationWithRLS } from "../services/rowLevelSecurity";

/**
 * Query: Get leadership decisions by company and quarter
 */
export const get = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const decision = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return decision;
  },
});

/**
 * Mutation: Create leadership decisions
 *
 * Creates a new leadership decision submission.
 */
export const create = mutationWithRLS({
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
    const decisionId = await ctx.db.insert("leadershipDecisions", args);
    return decisionId;
  },
});
