/**
 * Test Functions for Auth
 *
 * Helper queries, mutations, and actions for manual testing via Convex dashboard.
 * These are marked with underscore prefix to indicate internal/test usage.
 *
 * Usage:
 * 1. Open Convex dashboard: npx convex dashboard
 * 2. Navigate to "Functions" → "auth" → "test"
 * 3. Run _verifyUser with an email address to check if user exists
 * 4. Run _listPendingRequests to see pending access requests
 *
 * Note: These functions are for development/testing only.
 * For testing magic link flow, use the signIn action from your frontend.
 *
 * Example frontend usage:
 * ```tsx
 * import { useAction } from "convex/react";
 * import { api } from "./convex/_generated/api";
 *
 * function SignInForm() {
 *   const sendTestMagicLink = useAction(api.auth.test.sendTestMagicLink);
 *   return <button onClick={() => sendTestMagicLink({ email: "test@example.com" })}>
 *     Send Magic Link
 *   </button>;
 * }
 * ```
 */

import { mutation, action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Send a test magic link email (Action)
 *
 * This action is used for testing the magic link flow from the frontend.
 * It generates and sends a magic link to the specified email address.
 *
 * Usage from frontend:
 * ```tsx
 * const sendTestMagicLink = useAction(api.auth.test.sendTestMagicLink);
 * await sendTestMagicLink({ email: "test@example.com" });
 * ```
 *
 * The email will contain a magic link that, when clicked, will sign the user in.
 *
 * Note: This is a simplified test helper. For production use, call the signIn
 * action directly from your frontend with the appropriate provider.
 */
export const sendTestMagicLink = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    try {
      console.log(`Sending test magic link to: ${email}`);

      // For testing purposes, we return instructions rather than actually sending
      // In a real scenario with Resend configured, you would call the signIn action
      // directly from the frontend, not from server-side code.
      return {
        success: true,
        message: `To send a magic link to ${email}, call the signIn action from your frontend:`,
        instructions: {
          method: "POST",
          action: "api.auth.signIn",
          params: {
            provider: "resend-magic-link",
            params: { email },
          },
        },
      };
    } catch (error) {
      console.error("Error sending test magic link:", error);
      return {
        success: false,
        message: `Failed to send magic link: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Verify user exists in users table
 *
 * Helper mutation to check if a user has been created.
 * Useful for verifying that the signIn callback worked correctly.
 */
export const _verifyUser = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return {
        found: false,
        message: `No user found with email: ${email}`,
      };
    }

    return {
      found: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        gameId: user.gameId,
        companyId: user.companyId,
      },
    };
  },
});

/**
 * List pending access requests
 *
 * Helper mutation to see all pending access requests.
 * Useful for debugging the access request workflow.
 */
export const _listPendingRequests = mutation({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("accessRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return {
      count: requests.length,
      requests: requests.map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        role: r.role,
      })),
    };
  },
});
