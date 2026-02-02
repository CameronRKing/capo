/**
 * Users Domain Service
 *
 * User profile and authentication queries.
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Query: Get current authenticated user
 *
 * Returns the user profile for the currently authenticated user.
 * Used by the useCurrentUser hook throughout the app.
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    // Look up user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
      .first();

    return user;
  },
});
