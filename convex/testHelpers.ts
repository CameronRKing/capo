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
import { internalMutation, query } from "./_generated/server";

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

/**
 * TEMPORARY: Authenticate as a test user for E2E testing with ?user={email}
 *
 * This query allows frontend to fetch a test user by email for testing purposes.
 * When ?user=student@test.com is in the URL, the frontend calls this to get the user.
 *
 * SECURITY: This bypasses normal authentication. NEVER expose this in production.
 * This should be disabled or removed before deploying to production.
 *
 * @param email - The test user's email (e.g., "student@test.com")
 * @returns The test user object
 */
export const authenticateTestUser = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    // Only allow test user emails
    const allowedTestUsers = [
      "student@test.com",
      "teacher@test.com",
      "admin@test.com",
    ];

    if (!allowedTestUsers.includes(email)) {
      throw new Error(`Not a valid test user email: ${email}`);
    }

    // Look up the test user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new Error(`Test user not found: ${email}. Run seed.createTestUsers first.`);
    }

    return user;
  },
});

/**
 * TEMPORARY: Test user session storage (in-memory)
 *
 * Stores the current test user email for each "session".
 * The frontend calls setTestUserSession when it detects ?user={email} in the URL.
 * Then RLS queries can read this to know which test user to use.
 *
 * LIMITATION: This is per-server-instance and will be lost on restart.
 * ONLY for development/testing.
 */
const testUserSessions = new Map<string, string>(); // sessionId -> email

/**
 * TEMPORARY: Set the test user for the current session
 *
 * Call this when frontend detects ?user={email} in the URL.
 * Stores the test user email so RLS queries know which user to act as.
 *
 * @param sessionId - A unique session identifier (e.g., timestamp + random)
 * @param email - The test user's email
 * @returns Success confirmation
 */
export const setTestUserSession = internalMutation({
  args: {
    sessionId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { sessionId, email }) => {
    // Only allow test user emails
    const allowedTestUsers = [
      "student@test.com",
      "teacher@test.com",
      "admin@test.com",
    ];

    if (!allowedTestUsers.includes(email)) {
      throw new Error(`Not a valid test user email: ${email}`);
    }

    // Store the session
    testUserSessions.set(sessionId, email);

    return { success: true, email };
  },
});

/**
 * TEMPORARY: Get the test user email for a session
 *
 * Called by RLS wrapper to determine which test user to use.
 *
 * @param sessionId - The session identifier
 * @returns The test user email, or undefined if not found
 */
export function getTestUserSessionEmail(sessionId: string): string | undefined {
  return testUserSessions.get(sessionId);
}
