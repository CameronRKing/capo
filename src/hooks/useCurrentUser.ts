/**
 * useCurrentUser Hook - Get current authenticated user
 *
 * Returns the currently authenticated user from Convex auth.
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

export type User = Doc<"users">;

/**
 * Hook to get current authenticated user
 *
 * Returns undefined if loading
 * Returns null if not authenticated or on error
 * Returns user object if authenticated.
 *
 * @returns User object, null, or undefined
 */
export function useCurrentUser(): User | null | undefined {
  const result = useQuery(api.users.getCurrent);

  // Handle case where query returns undefined or has error
  if (!result || result.error) {
    return null;
  }

  return result;
}
