/**
 * Auth Mutations for Frontend
 *
 * Exposes auth mutations (signIn, signOut) to the frontend.
 * These wrap the @convex-dev/auth server functions.
 */

"use node";

import { mutation } from "./_generated/server";
import { auth } from "./auth/config";

/**
 * Sign in with magic link
 *
 * Initiates the magic link sign-in flow by sending an email.
 * The email provider (Resend) will send a sign-in link to the user.
 *
 * @param provider - Must be "resend"
 * @param email - User's email address
 * @param redirectUrl - Optional URL to redirect to after sign-in
 */
export const signIn = mutation({
  args: {
    provider: v.string(),
    email: v.optional(v.string()),
    redirectUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // This mutation will be handled by @convex-dev/auth
    // The actual auth library creates its own mutations
    // We need to call through to the auth instance

    // Note: @convex-dev/auth creates its own mutation endpoints
    // This is a placeholder - the actual signIn is called via:
    // const signIn = useMutation(api.auth.signIn);

    // The auth package auto-generates these mutations
    throw new Error(
      "Use the generated auth mutations from @convex-dev/auth: api.auth.signIn"
    );
  },
});

/**
 * Sign out
 *
 * Signs out the current user by clearing their session.
 */
export const signOut = mutation({
  args: {},
  handler: async (ctx) => {
    // Handled by @convex-dev/auth
    throw new Error(
      "Use the generated auth mutations from @convex-dev/auth: api.auth.signOut"
    );
  },
});
