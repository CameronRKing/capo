/**
 * Active Reps Domain Module
 *
 * Functions for managing active sales reps (per company, per quarter).
 * All functions use RLS (Row-Level Security) for automatic access control.
 */

import { v } from "convex/values";
import { queryWithRLS, mutationWithRLS } from "../services/rowLevelSecurity";

/**
 * List all active reps for a company in a specific quarter
 *
 * Returns reps sorted by repId for consistent ordering.
 */
export const listByCompanyQuarter = queryWithRLS({
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

    // Sort by repId for consistent ordering
    return reps.sort((a, b) => a.repId.localeCompare(b.repId));
  },
});

/**
 * Get a single active rep by ID
 */
export const get = queryWithRLS({
  args: {
    id: v.id("activeReps"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Update rep settings (individual hours, leadership behavior)
 *
 * Used by leadership decision form to update per-rep settings.
 */
export const updateRepSettings = mutationWithRLS({
  args: {
    repId: v.id("activeReps"),
    individualHours: v.number(),
    leadershipBehavior: v.string(),
  },
  handler: async (ctx, { repId, individualHours, leadershipBehavior }) => {
    // Verify the rep exists and user has access (enforced by RLS)
    const rep = await ctx.db.get(repId);
    if (!rep) {
      throw new Error("Rep not found");
    }

    // Update settings
    await ctx.db.patch(repId, {
      individualHours,
      leadershipBehavior,
    });

    return repId;
  },
});

/**
 * Bulk update rep settings
 *
 * Updates settings for multiple reps in a single mutation.
 */
export const bulkUpdateRepSettings = mutationWithRLS({
  args: {
    updates: v.array(
      v.object({
        repId: v.id("activeReps"),
        individualHours: v.number(),
        leadershipBehavior: v.string(),
      })
    ),
  },
  handler: async (ctx, { updates }) => {
    // Update each rep (RLS will enforce access)
    for (const update of updates) {
      const rep = await ctx.db.get(update.repId);
      if (!rep) {
        throw new Error(`Rep ${update.repId} not found`);
      }

      await ctx.db.patch(update.repId, {
        individualHours: update.individualHours,
        leadershipBehavior: update.leadershipBehavior,
      });
    }

    return updates.length;
  },
});
