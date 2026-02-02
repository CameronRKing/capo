/**
 * Convex Auth Configuration
 *
 * Configures @convex-dev/auth with magic link authentication.
 *
 * Docs: https://labs.convex.dev/auth/config/email
 * Example: https://github.com/get-convex/convex-auth-with-role-based-permissions
 */

// "use node";  // Temporarily disabled due to Node version compatibility issue

import { convexAuth } from "@convex-dev/auth/server";
// import { Resend } from "./email";
import { callbacks } from "./callbacks";

/**
 * Auth instance with magic link provider
 *
 * Configuration:
 * - Provider: Resend email service for magic links
 * - Expiration: 15 minutes (900 seconds)
 * - Replay prevention: Built-in to @convex-dev/auth via token tracking
 * - Custom callbacks: Integrates with users table and access request workflow
 *
 * TEMPORARY: Email provider disabled due to bundling issues
 * TODO: Fix email provider integration
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [], // Disabled temporarily: [Resend]
  callbacks,
});
