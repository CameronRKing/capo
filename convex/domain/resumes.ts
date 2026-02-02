/**
 * Resumes Domain Service
 *
 * Resume profile queries and operations.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Query: Get all resumes
 *
 * Returns all resume profiles for ranking.
 * Ordered by repId for consistent display.
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const resumes = await ctx.db
      .query("resumes")
      .order("asc")
      .collect();

    return resumes;
  },
});

/**
 * Query: Get resume by repId
 *
 * Returns a single resume profile.
 */
export const getByRepId = query({
  args: {
    repId: v.string(),
  },
  handler: async (ctx, { repId }) => {
    const resume = await ctx.db
      .query("resumes")
      .withIndex("by_repId", (q) => q.eq("repId", repId))
      .first();

    return resume;
  },
});
