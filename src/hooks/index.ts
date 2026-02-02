/**
 * Collaboration Hooks - React hooks for presence and focus tracking
 *
 * Exports all hooks for integrating presence features into components.
 *
 * @example
 * ```tsx
 * import {
 *   usePresence,
 *   useFocus,
 *   useCurrentUser,
 *   useRankings
 * } from "@/hooks";
 * ```
 */

// Presence hooks
export { usePresence } from "./usePresence";
export type { UserPresence, UsePresenceReturn } from "./usePresence";

// Focus hooks
export { useFocus, constructFieldId } from "./useFocus";
export type { FocusedUser, UseFocusReturn } from "./useFocus";

// User hooks
export { useCurrentUser } from "./useCurrentUser";
export type { User } from "./useCurrentUser";

// Ranking hooks
export { useRankings } from "./useRankings";
export type { RankingProgress, UseRankingsReturn } from "./useRankings";
