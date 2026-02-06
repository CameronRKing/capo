/**
 * Seed Test Users for E2E Testing
 *
 * Creates three test users for E2E testing:
 * - student@test.com (student role)
 * - teacher@test.com (teacher role)
 * - admin@test.com (admin role)
 *
 * Run via Convex Dashboard: https://charming-bass-286.convex.cloud/dashboard
 */

import { mutation } from "../_generated/server";

export const createTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const testUsers = [
      {
        name: "Test Student",
        email: "student@test.com",
        role: "student",
      },
      {
        name: "Test Teacher",
        email: "teacher@test.com",
        role: "teacher",
      },
      {
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
      },
    ];

    const results = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", userData.email))
        .first();

      if (existing) {
        results.push({
          email: userData.email,
          action: "skipped",
          reason: "already exists",
          id: existing._id,
        });
        continue;
      }

      // Create new user
      const userId = await ctx.db.insert("users", {
        ...userData,
        tokenIdentifier: `test:${userData.email}`,
      });

      results.push({
        email: userData.email,
        action: "created",
        id: userId,
      });
    }

    return {
      success: true,
      results,
    };
  },
});
