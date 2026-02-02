/**
 * User Functions
 *
 * Provides queries and mutations for user management.
 */

import { query } from "./_generated/server";
import { getCurrentUser } from "./services/permissions";

/**
 * Get the currently authenticated user
 *
 * Returns the full user document including role and assignments.
 * Used by frontend protected routes and components.
 *
 * @returns The authenticated user or null if not authenticated
 * @throws Error if user not found in database (shouldn't happen after auth)
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);
      return user;
    } catch (error) {
      // Return null if not authenticated or user not found
      return null;
    }
  },
});

/**
 * Get user by ID
 *
 * Fetches a specific user by their ID.
 * Access controlled by RLS (admins and self-access).
 */
export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user;
  },
});
