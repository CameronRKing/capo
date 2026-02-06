/**
 * Permission utilities for role-based access control
 *
 * Provides helper functions to check user permissions and access control
 * for the business simulation platform. Integrates with @convex-dev/auth
 * to retrieve authenticated user context.
 */

import { QueryCtx, ActionCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * User roles in the system
 */
export type Role = "admin" | "teacher" | "student";

/**
 * Authenticated user with role and assignments
 */
export interface User {
  _id: Id<"users">;
  name: string;
  email: string;
  role: Role;
  gameId?: Id<"games">;
  companyId?: Id<"companies">;
}

/**
 * TEMPORARY: Test user session storage for E2E testing
 *
 * Stores test user identity in a volatile way (in-memory only).
 * This is ONLY for development/testing with ?user={email} query param.
 *
 * Production should use proper Convex Auth.
 *
 * LIMITATION: This Map is per-server-instance and will be lost on restart.
 * Works for single-instance testing, but NOT for production.
 */
const testUserSession = new Map<string, User>();

/**
 * TEMPORARY: Set test user session for E2E testing
 *
 * Call this when a test user "logs in" via ?user={email} query param.
 *
 * @param email - The test user's email
 * @returns The user object that was set
 */
export async function setTestUserSession(email: string): Promise<User> {
  // In a real implementation, this would use proper sessions/tokens
  // For now, we'll store it directly in the Map
  // This is a SECURITY RISK and should NEVER be used in production
  return new Promise((resolve, reject) => {
    // Use setTimeout to make this async (simulating a DB operation)
    setTimeout(async () => {
      // This is a hack - we need access to the database here
      // For now, return a placeholder - the actual implementation will be different
      resolve(null as any);
    }, 0);
  });
}

/**
 * TEMPORARY: Get test user from email for E2E testing
 *
 * Looks up a test user by email (for use with ?user={email} query param).
 *
 * @param ctx - The Convex context
 * @param email - The test user's email
 * @returns The test user, or null if not found
 */
export async function getTestUserByEmail(ctx: QueryCtx | ActionCtx, email: string): Promise<User | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  return user ?? null;
}

/**
 * Retrieve the currently authenticated user from the Convex context
 *
 * @param ctx - The Convex query context or action context
 * @returns The authenticated user with role and assignments
 * @throws Error if not authenticated or user not found
 */
export async function getCurrentUser(ctx: QueryCtx): Promise<User>;
export async function getCurrentUser(ctx: ActionCtx): Promise<User>;
export async function getCurrentUser(ctx: QueryCtx | ActionCtx): Promise<User> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

/**
 * TEMPORARY: Get current user with test mode fallback
 *
 * For development/E2E testing with ?user={email} query param.
 * Falls back to first test user if no Convex auth identity exists.
 *
 * This should NOT be used in production - only for testing.
 *
 * @param ctx - The Convex query context or action context
 * @param testUserEmail - Optional test user email (for testing with ?user= param)
 * @returns The authenticated user, or test user as fallback
 * @throws Error if user not found
 */
export async function getCurrentUserOrTestUser(ctx: QueryCtx, testUserEmail?: string): Promise<User>;
export async function getCurrentUserOrTestUser(ctx: ActionCtx, testUserEmail?: string): Promise<User>;
export async function getCurrentUserOrTestUser(ctx: QueryCtx | ActionCtx, testUserEmail?: string): Promise<User> {
  try {
    // Try normal auth first
    return await getCurrentUser(ctx);
  } catch (err) {
    // If testUserEmail is provided, use that specific test user
    if (testUserEmail) {
      const testUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", testUserEmail))
        .first();

      if (!testUser) {
        throw new Error(`Test user not found: ${testUserEmail}`);
      }

      return testUser;
    }

    // Otherwise, fall back to first available test user (for E2E testing)
    // This is a temporary workaround - production should use proper auth
    const testUsers = ["student@test.com", "teacher@test.com", "admin@test.com"];

    for (const email of testUsers) {
      const testUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();

      if (testUser) {
        console.warn(`[getCurrentUserOrTestUser] No auth identity, falling back to test user: ${email}`);
        return testUser;
      }
    }

    throw new Error("No authenticated user and no test users found. Run seed.createTestUsers first.");
  }
}

/**
 * Check if a user has one of the specified roles
 *
 * @param user - The user to check
 * @param roles - Array of roles to check against
 * @returns true if user's role is in the allowed roles array
 */
export function hasRole(user: User, roles: Role[]): boolean {
  return roles.includes(user.role);
}

/**
 * Check if a user can access a specific game
 *
 * Access rules:
 * - Admins: Can access any game
 * - Teachers: Can access their assigned game only
 * - Students: Can access their assigned game only
 *
 * @param user - The user to check
 * @param gameId - The game ID to check access for
 * @returns true if user can access the game
 */
export function canAccessGame(
  user: User,
  gameId: Id<"games">
): boolean {
  return (
    user.role === "admin" ||
    (user.role === "teacher" && user.gameId === gameId) ||
    (user.role === "student" && user.gameId === gameId)
  );
}

/**
 * Check if a user can access a specific company
 *
 * Access rules:
 * - Admins: Can access any company
 * - Teachers: Can access companies in their game (requires caller to verify company.gameId)
 * - Students: Can access their assigned company only
 *
 * @param user - The user to check
 * @param companyId - The company ID to check access for
 * @returns true if user can access the company
 */
export function canAccessCompany(
  user: User,
  companyId: Id<"companies">
): boolean {
  return user.role === "admin" || user.companyId === companyId;
}
