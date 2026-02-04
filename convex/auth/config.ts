/**
 * Convex Auth Configuration
 *
 * TEMPORARY: Auth DISABLED - using simplified ?user={email} query param for E2E testing
 *
 * Current state:
 * - No providers configured (auth disabled)
 * - Frontend uses ?user={email} URL param for test authentication
 * - See bd-2tk for proper Mailgun magic link implementation
 *
 * Docs:
 * - Password setup: https://labs.convex.dev/auth/config/passwords
 * - Custom email: https://labs.convex.dev/auth/api_reference/providers/Email
 */

import { convexAuth } from "@convex-dev/auth/server";
import { callbacks } from "./callbacks";

/**
 * Auth instance - DISABLED for simplified testing
 *
 * Using ?user={email} query param approach instead.
 * Run convex.seed.createTestUsers to seed test accounts.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [], // Disabled - using ?user={email} query param for testing
  callbacks: callbacks as any, // Type assertion for auth library compatibility
});
