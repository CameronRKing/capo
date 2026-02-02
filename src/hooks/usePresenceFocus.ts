/**
 * usePresenceFocus Hook
 *
 * React hook for tracking and displaying real-time focus state on form inputs.
 * Integrates with Convex presence services to show which users are focused on which fields.
 *
 * Features:
 * - Automatic focus tracking on mount/unmount
 * - Real-time updates when other users focus/blur
 * - Per-user color assignment
 * - Last edited metadata
 * - Multi-user focus support
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { getUserColor } from "../lib/utils/userColors";

export interface FocusedUser {
  _id: Id<"users">;
  name: string;
  email: string;
  color: ReturnType<typeof getUserColor>;
  timestamp: number;
}

export interface LastEditedInfo {
  userId: Id<"users">;
  userName: string;
  timestamp: number;
  formatted: string;
}

export interface UsePresenceFocusOptions {
  /** The company ID for presence room */
  companyId: Id<"companies">;
  /** The entity type (e.g., "hiring", "leadership", "rankings") */
  entity: string;
  /** The field path (e.g., "salary", "timeRecruiting") */
  fieldPath: string;
  /** Current user ID (from auth) */
  userId: Id<"users">;
  /** Whether to enable focus tracking (default: true) */
  enabled?: boolean;
}

export interface UsePresenceFocusResult {
  /** Array of users currently focused on this field (excluding current user) */
  focusedUsers: FocusedUser[];
  /** Whether multiple users are focused on this field */
  hasMultipleUsers: boolean;
  /** Whether the current user is focused */
  isFocused: boolean;
  /** Last edited metadata for this field */
  lastEdited: LastEditedInfo | null;
  /** Handler to call when input is focused */
  handleFocus: () => void;
  /** Handler to call when input is blurred */
  handleBlur: () => void;
  /** Update last edited metadata */
  updateLastEdited: () => Promise<void>;
}

/**
 * Hook for real-time focus tracking on form inputs
 *
 * Automatically tracks focus/blur events and displays other users' focus state.
 * Shows avatars and colors for users currently focused on the same field.
 *
 * @param options - Configuration options
 * @returns Focus state and event handlers
 *
 * @example
 * ```tsx
 * function MyInput() {
 *   const user = useCurrentUser();
 *   const { focusedUsers, hasMultipleUsers, handleFocus, handleBlur } = usePresenceFocus({
 *     companyId: user.companyId,
 *     entity: "hiring",
 *     fieldPath: "salary",
 *     userId: user._id,
 *   });
 *
 *   return (
 *     <div className={hasMultipleUsers ? "ring-2 ring-purple-500" : ""}>
 *       <input
 *         onFocus={handleFocus}
 *         onBlur={handleBlur}
 *         // ...
 *       />
 *       {focusedUsers.length > 0 && (
 *         <FacePile users={focusedUsers} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePresenceFocus({
  companyId,
  entity,
  fieldPath,
  userId,
  enabled = true,
}: UsePresenceFocusOptions): UsePresenceFocusResult {
  // Construct field ID for presence tracking
  const fieldId = `${companyId}:${entity}:${fieldPath}`;

  // Queries and mutations
  const focusedUsersQuery = useQuery(
    api.services.presenceFocus.getFocusByField,
    enabled ? { fieldId } : "skip"
  );
  const lastEditedQuery = useQuery(
    api.services.presenceFocus.getLastEdited,
    enabled ? { fieldId } : "skip"
  );
  const updateFocusMutation = useMutation(api.services.presenceFocus.updateFocus);
  const clearFocusMutation = useMutation(api.services.presenceFocus.clearFocus);
  const updateLastEditedMutation = useMutation(
    api.services.presenceFocus.updateLastEdited
  );

  // Local state
  const [isFocused, setIsFocused] = useState(false);
  const hasUpdatedRef = useRef(false); // Track if user has modified the field

  // Process focused users (add colors, filter out current user)
  const focusedUsers: FocusedUser[] = (focusedUsersQuery ?? []).map((user) => ({
    ...user,
    color: getUserColor(user._id),
  }));

  // Filter out current user from display
  const otherFocusedUsers = focusedUsers.filter((u) => u._id !== userId);
  const hasMultipleUsers = otherFocusedUsers.length > 1;

  // Focus handler
  const handleFocus = useCallback(() => {
    if (!enabled) return;

    setIsFocused(true);

    // Update presence
    updateFocusMutation({ fieldId, userId });
  }, [enabled, fieldId, userId, updateFocusMutation]);

  // Blur handler
  const handleBlur = useCallback(() => {
    if (!enabled) return;

    setIsFocused(false);

    // Clear presence
    clearFocusMutation({ userId });

    // Update last edited if user modified the field
    if (hasUpdatedRef.current) {
      updateLastEditedMutation({ fieldId, companyId });
      hasUpdatedRef.current = false;
    }
  }, [enabled, userId, fieldId, companyId, clearFocusMutation, updateLastEditedMutation]);

  // Update last edited metadata
  const updateLastEdited = useCallback(async () => {
    if (!enabled) return;

    hasUpdatedRef.current = true;
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear focus when component unmounts
      if (isFocused && enabled) {
        clearFocusMutation({ userId });
      }
    };
  }, [enabled, isFocused, userId, clearFocusMutation]);

  return {
    focusedUsers: otherFocusedUsers,
    hasMultipleUsers,
    isFocused,
    lastEdited: lastEditedQuery ?? null,
    handleFocus,
    handleBlur,
    updateLastEdited,
  };
}
