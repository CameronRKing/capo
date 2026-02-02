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
