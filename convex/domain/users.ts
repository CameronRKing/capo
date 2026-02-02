/**
 * Users Domain Service
 *
 * User profile and authentication queries.
 */

import { query, queryWithRLS } from "../_generated/server";
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

/**
 * Query: List users by company
 *
 * Returns all users assigned to a specific company.
 * Used for displaying team members and presence.
 *
 * Access Control (via RLS):
 * - Students: Can read their own company's users
 * - Teachers: Can read users in companies in their game
 * - Admins: Can read any company's users
 *
 * @param companyId - The ID of the company to list users for
 * @returns Array of users in the company
 */
export const listByCompany = queryWithRLS({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    return users;
  },
});
