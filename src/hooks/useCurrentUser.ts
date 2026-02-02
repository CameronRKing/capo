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
 */

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";

export type User = Doc<"users">;

/**
 * Hook to get current authenticated user
 *
 * Returns undefined if user is not authenticated or is loading.
 * Returns user object if authenticated.
 *
 * @returns User object or undefined
 */
export function useCurrentUser(): User | undefined {
  const user = useQuery(api.users.getCurrent);

  return user;
}
