/**
 * Test Helper Functions
 *
 * Internal functions to support E2E testing with real Convex backend.
 * These functions provide low-level database operations for test setup.
 *
 * SECURITY: These should NEVER be exposed as public API functions.
 * They are marked as internal to prevent external access.
 */

import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Insert a document directly into a table
 *
 * This is a test-only helper that bypasses normal validation and business logic.
 * It should only be used from E2E tests with a real backend.
 */
export const insert = internalMutation({
  args: {
    table: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { table, value }) => {
    // Only allow this in test mode (IS_TEST environment variable)
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.insert is only available in test mode");
    }

    // @ts-ignore - Dynamic table access
    return await ctx.db.insert(table, value);
  },
});

/**
 * Get a document by ID from any table
 *
 * This is a test-only helper for direct database access.
 */
export const get = internalMutation({
  args: {
    table: v.string(),
    id: v.string(),
  },
  handler: async (ctx, { table, id }) => {
    // Only allow this in test mode
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.get is only available in test mode");
    }

    // @ts-ignore - Dynamic table access
    return await ctx.db.get(id as any);
  },
});

/**
 * Delete a document by ID
 *
 * This is a test-only helper for cleanup.
 */
export const erase = internalMutation({
  args: {
    id: v.id("_storage"),
  },
  handler: async (ctx, { id }) => {
    // Only allow this in test mode
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.erase is only available in test mode");
    }

    // @ts-ignore - Delete from any table
    return await ctx.db.delete(id as any);
  },
});

/**
 * Clear all data from a table (for test isolation)
 *
 * WARNING: This is destructive and should only be used in test environments.
 */
export const clearTable = internalMutation({
  args: {
    table: v.string(),
  },
  handler: async (ctx, { table }) => {
    // Only allow this in test mode
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.clearTable is only available in test mode");
    }

    // Get all documents
    // @ts-ignore - Dynamic table access
    const docs = await ctx.db.query(table).collect();

    // Delete all documents
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    return { deleted: docs.length };
  },
});

/**
 * Reset the entire database (for complete test isolation)
 *
 * WARNING: EXTREMELY DESTRUCTIVE. Never use this in production.
 */
export const resetDatabase = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Only allow this in test mode with explicit flag
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.resetDatabase is only available in test mode");
    }

    if (!process.env.ALLOW_DB_RESET) {
      throw new Error("testHelpers.resetDatabase requires ALLOW_DB_RESET=true");
    }

    // Clear all tables
    const tables = [
      "users",
      "accessRequests",
      "games",
      "companies",
      "hiringDecisions",
      "leadershipDecisions",
      "workingHiringDecisions",
      "workingLeadershipDecisions",
      "reports",
      "rankings",
    ];

    for (const table of tables) {
      // @ts-ignore - Dynamic table access
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    return { success: true };
  },
});
