/**
 * usePresence Hook - Real-time user presence tracking
 *
 * Wrapper around @convex-dev/presence/react's usePresence with Capo-specific
 * room token management and automatic heartbeat.
 *
 * Features:
 * - Automatic heartbeat every 10 seconds
 * - Session management with unique session ID
 * - Cleanup on unmount (disconnect)
 * - Company-room presence tracking
 * - Color assignment for users
 *
 * @example
 * ```tsx
 * function CompanyHeader() {
 *   const user = useCurrentUser();
 *   const { onlineUsers, isOnline, getUserColor } = usePresence(user.companyId);
 *
 *   return (
 *     <div>
 *       <FacePile users={onlineUsers} />
 *       <span>{onlineUsers.length} online</span>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useQueryWithRLS, useMutationWithRLS, useCurrentUser } from "./useCurrentUser";

// Color palette for user cursors and avatars
// Distinct colors accessible for color-blind users
const USER_COLORS = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#a855f7", // purple-500
];

/**
 * User presence data returned from the hook
 */
export interface UserPresence {
  user: {
    _id: Id<"users">;
    name: string;
    email: string;
  };
  // Additional metadata from @convex-dev/presence
  [key: string]: any;
}

/**
 * Return type for usePresence hook
 */
export interface UsePresenceReturn {
  /** List of online users in the room */
  onlineUsers: UserPresence[];
  /** Check if a specific user is online */
  isOnline: (userId: Id<"users">) => boolean;
  /** Get assigned color for a user */
  getUserColor: (userId: Id<"users">) => string;
  /** Loading state */
  isLoading: boolean;
  /** Error state - true if heartbeat or presence query failed */
  hasError: boolean;
}

/**
 * Hook for real-time user presence in a company room
 *
 * @param companyId - The Convex ID of the company (room)
 * @returns Presence state and utilities
 *
 * @example
 * ```tsx
 * const { onlineUsers, isOnline, getUserColor } = usePresence("company123");
 * ```
 */
export function usePresence(
  companyId: Id<"companies"> | string | null | undefined
): UsePresenceReturn {
  // Get current user for heartbeat
  const user = useCurrentUser();

  // Mutations with RLS support for test users
  const heartbeat = useMutationWithRLS(api.services.presence.heartbeat);
  const disconnect = useMutationWithRLS(api.services.presence.disconnect);

  // Query with RLS support for test users
  const rawPresence = useQueryWithRLS(
    api.services.presence.list,
    companyId ? { roomToken: `company:${companyId}` } : "skip"
  );

  // Session management
  const sessionIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const errorRef = useRef<boolean>(false);

  // Initialize session on mount
  useEffect(() => {
    if (!companyId) return;

    // Generate unique session ID for this browser tab
    sessionIdRef.current = crypto.randomUUID();

    // Start heartbeat interval (every 10 seconds)
    intervalRef.current = setInterval(async () => {
      if (!companyId || !sessionIdRef.current || !user) return;

      try {
        const sessionToken = await heartbeat({
          roomId: `company:${companyId}`,
          userId: user._id,
          sessionId: sessionIdRef.current,
          interval: 10000,
        });

        // Store session token for cleanup
        if (sessionToken) {
          sessionTokenRef.current = sessionToken;
        }

        // Clear error on successful heartbeat
        errorRef.current = false;
      } catch (error) {
        // Presence heartbeat failed - will retry on next interval
        errorRef.current = true;
      }
    }, 10000);

    // Initial heartbeat
    if (user) {
      heartbeat({
        roomId: `company:${companyId}`,
        userId: user._id,
        sessionId: sessionIdRef.current,
        interval: 10000,
      })
        .then(() => {
          errorRef.current = false;
        })
        .catch((error) => {
          // Initial presence heartbeat failed - will retry
          errorRef.current = true;
        });
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Disconnect from presence
      if (sessionTokenRef.current) {
        disconnect({ sessionToken: sessionTokenRef.current })
          .then(() => {
            errorRef.current = false;
          })
          .catch((error) => {
            // Disconnect failed - not critical during cleanup
          });
      }
    };
  }, [companyId, heartbeat, disconnect, user]);

  // Process presence data
  const onlineUsers: UserPresence[] = (rawPresence ?? []).map((entry) => ({
    user: {
      _id: entry.user._id,
      name: entry.user.name,
      email: entry.user.email,
    },
    ...entry,
  }));

  // Check if user is online
  const isOnline = useCallback(
    (userId: Id<"users">) => {
      return onlineUsers.some((u) => u.user._id === userId);
    },
    [onlineUsers]
  );

  // Assign consistent color to user based on their ID
  const getUserColor = useCallback(
    (userId: Id<"users">) => {
      // Hash the user ID to get a consistent index
      const hash = userId.split("").reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);

      return USER_COLORS[hash % USER_COLORS.length];
    },
    []
  );

  return {
    onlineUsers,
    isOnline,
    getUserColor,
    isLoading: rawPresence === undefined,
    hasError: errorRef.current,
  };
}
