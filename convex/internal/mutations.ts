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
