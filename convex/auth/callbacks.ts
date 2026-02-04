/**
 * Custom Auth Callbacks
 *
 * Customizes the authentication flow to integrate with Capo's user management:
 * - Checks if user exists in users table (by email)
 * - If exists: returns existing user ID
 * - If not exists: checks accessRequests table for approved request
 * - If approved: creates user with role/gameId/companyId from request
 * - If no approved request: throws error to require access request
 *
 * This enforces the access control workflow where users must be approved
 * before they can sign in.
 *
 * Reference: https://labs.convex.dev/auth/config
 */

import type { GenericMutationCtx, GenericDataModel } from "convex/server";

/**
 * Custom createOrUpdateUser callback
 *
 * Called during the sign-in process, before account creation and token generation.
 * This callback is responsible for creating or updating the user document.
 *
 * For email magic links, this is called when the user clicks the link in their email.
 *
 * Note: Typed with GenericMutationCtx<any> for compatibility with @convex-dev/auth
 * which expects callbacks that work with any DataModel, not just our specific one.
 */
export const createOrUpdateUser = async (
  ctx: GenericMutationCtx<any>,
  args: {
    existingUserId: string | null;
    profile: {
      email?: string;
      name?: string;
      [key: string]: any;
    };
    [key: string]: any;
  }
): Promise<string> => {
  const { existingUserId, profile } = args;
  const email = profile.email;

  // Validate email exists
  if (!email) {
    throw new Error("Email is required from auth provider");
  }

  // Determine if this is a new user (existingUserId is null)
  const isNewUser = existingUserId === null;

  console.log(`createOrUpdateUser callback called for email: ${email}, existingUserId: ${existingUserId}, isNewUser: ${isNewUser}`);

  // If user already exists, return their ID
  if (existingUserId) {
    console.log(`User already exists: ${existingUserId}`);
    return existingUserId;
  }

  // Check if user exists in users table (shouldn't happen if existingUserId is null, but let's be safe)
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .first();

  if (existingUser) {
    console.log(`User found in users table: ${existingUser._id}`);
    return existingUser._id;
  }

  // User doesn't exist - check for approved access request
  const accessRequest = await ctx.db
    .query("accessRequests")
    .withIndex("by_status", (q) => q.eq("status", "approved"))
    .filter((q) => q.eq(q.field("email"), email))
    .first();

  if (!accessRequest) {
    throw new Error(
      "Access not granted. Please request access from your teacher or administrator."
    );
  }

  // Create user from approved access request
  const userId = await ctx.db.insert("users", {
    name: accessRequest.name || profile.name || email.split("@")[0],
    email: accessRequest.email,
    role: accessRequest.role,
    gameId: accessRequest.requestedGameId,
    companyId: accessRequest.requestedCompanyId,
  });

  console.log(
    `User created: ${userId} with role ${accessRequest.role}`
  );

  return userId;
};

/**
 * Callback configuration for @convex-dev/auth
 *
 * This object is passed to the convexAuth constructor to customize behavior.
 */
export const callbacks = {
  /**
   * Called during sign-in to create or update user account
   *
   * This integrates with our users table and access control workflow.
   */
  createOrUpdateUser,
};
