/**
 * Permission utilities for role-based access control
 *
 * Provides helper functions to check user permissions and access control
 * for the business simulation platform. Integrates with @convex-dev/auth
 * to retrieve authenticated user context.
 */

import { QueryCtx } from "../_generated/server";
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
