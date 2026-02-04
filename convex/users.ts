/**
 * User Functions
 *
 * Provides queries and mutations for user management.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
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
 * Get user by email (for simplified test auth)
 *
 * TEMPORARY: Used for E2E testing with ?user={email} query param
 * Skips Convex Auth and directly looks up user by email.
 *
 * Security note: Only use for development/E2E testing. Remove in production.
 *
 * @param email - User email to look up
 * @returns The user or null if not found
 */
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    return user ?? null;
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
