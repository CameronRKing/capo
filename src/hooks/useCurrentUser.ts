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
import { useLocation } from "@tanstack/react-router";

export type User = Doc<"users">;

/**
 * Get the test user email from URL query params
 * @returns Test user email or undefined
 */
export function useTestUserEmail(): string | undefined {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  return searchParams.get('user') || undefined;
}

/**
 * TEMPORARY: Wrapper around useQuery that automatically injects test user email for RLS
 *
 * When ?user={email} is in the URL, this hook automatically adds __testUserEmail
 * to query arguments so the backend RLS knows which test user to use.
 *
 * @example
 * ```tsx
 * // Instead of:
 * // const data = useQuery(api.student.dashboard.getDashboardData);
 *
 * // Use:
 * const data = useQueryWithRLS(api.student.dashboard.getDashboardData);
 * ```
 *
 * IMPORTANT: This is a temporary workaround for test mode authentication.
 * Production should use proper Convex Auth.
 */
export function useQueryWithRLS<Args extends Record<string, any>, ReturnType>(
  query: any,
  args?: Args | "skip"
): ReturnType | undefined {
  const testUserEmail = useTestUserEmail();

  // Automatically inject test user email if present
  const enrichedArgs = testUserEmail && args !== "skip"
    ? { ...args, __testUserEmail: testUserEmail }
    : testUserEmail
    ? { __testUserEmail: testUserEmail }
    : args;

  return useQuery(query, enrichedArgs as any);
}

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
  console.log('[useCurrentUser] Hook called');

  // Check for ?user={email} query param (for E2E testing)
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const testUserEmail = searchParams.get('user');
  console.log('[useCurrentUser] URL search params:', location.search);
  console.log('[useCurrentUser] Test user email from URL:', testUserEmail);

  // If test user email is present, use getByEmail query
  const testUserResult = useQuery(
    api.users.getByEmail,
    testUserEmail ? { email: testUserEmail } : "skip"
  );
  console.log('[useCurrentUser] testUserResult:', testUserResult);

  // Normal auth query
  const normalResult = useQuery(api.users.getCurrent);
  console.log('[useCurrentUser] normalResult:', normalResult);

  // Use test user if available, otherwise use normal auth
  const result = testUserEmail ? testUserResult : normalResult;
  console.log('[useCurrentUser] Selected result:', result);

  // If query is still loading (undefined), return undefined
  if (result === undefined) {
    console.log('[useCurrentUser] Query still loading, returning undefined');
    return undefined;
  }

  // If result is null (user not found), return null
  if (result === null) {
    console.log('[useCurrentUser] Query returned null (user not found)');
    return null;
  }

  // If there's an error, return null
  if (result.error) {
    console.error('[useCurrentUser] Error from query:', result.error);
    return null;
  }

  // Return the user object
  console.log('[useCurrentUser] Returning user:', result);
  return result;
}
