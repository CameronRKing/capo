/**
 * useCurrentUser Hook - Get current authenticated user
 *
 * TEMPORARY: Supports ?user={email} query param for simplified E2E testing
 * See bd-2tk for proper Mailgun magic link implementation
 *
 * Returns the currently authenticated user from Convex auth, or from URL param for testing.
 * Used throughout the app for authorization and personalization.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const user = useCurrentUser();
 *
 *   if (!user) return <div>Please log in</div>;
 *
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * }
 */

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc } from "@convex/_generated/dataModel";
import { useSearch } from "@tanstack/react-router";

export type User = Doc<"users">;

/**
 * Hook to get current authenticated user
 *
 * TEMPORARY: Checks for ?user={email} query param for E2E testing
 * Falls back to normal Convex Auth
 *
 * Returns undefined if loading
 * Returns null if not authenticated or on error
 * Returns user object if authenticated.
 *
 * @returns User object, null, or undefined
 */
export function useCurrentUser(): User | null | undefined {
  // Check for ?user={email} query param (for E2E testing)
  const search = useSearch({ strict: false });
  const testUserEmail = (search as any)?.user as string | null;

  // If test user email is present, use getByEmail query
  const testUserResult = useQuery(
    api.users.getByEmail,
    testUserEmail ? { email: testUserEmail } : "skip"
  );

  // Normal auth query
  const normalResult = useQuery(api.users.getCurrent);

  // Use test user if available, otherwise use normal auth
  const result = testUserEmail ? testUserResult : normalResult;

  // Handle case where query returns undefined or has error
  if (!result || result.error) {
    return null;
  }

  return result;
}
