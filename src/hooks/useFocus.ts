/**
 * useFocus Hook - Real-time input field focus tracking
 *
 * Tracks which users are focused on which input fields, supporting
 * multi-user collaboration indicators on form fields.
 *
 * Features:
 * - Track users focused on a specific field
 * - Update current user's focus on mount/blur
 * - Real-time reactive updates
 * - Automatic cleanup on unmount
 *
 * @example
 * ```tsx
 * function SalaryInput() {
 *   const user = useCurrentUser();
 *   const { focusedUsers, updateFocus, clearFocus } = useFocus(
 *     user.companyId,
 *     "hiring",
 *     "salary",
 *     user._id
 *   );
 *
 *   return (
 *     <div>
 *       <input
 *         onFocus={updateFocus}
 *         onBlur={clearFocus}
 *       />
 *       {focusedUsers.length > 0 && (
 *         <FacePile users={focusedUsers} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

/**
 * Focused user data returned from the hook
 */
export interface FocusedUser {
  user: {
    _id: Id<"users">;
    name: string;
    email: string;
  };
  timestamp: number;
}

/**
 * Return type for useFocus hook
 */
export interface UseFocusReturn {
  /** List of users currently focused on this field */
  focusedUsers: FocusedUser[];
  /** Call this when input receives focus */
  updateFocus: () => void;
  /** Call this when input loses focus */
  clearFocus: () => void;
  /** Number of users focused (including self) */
  focusCount: number;
  /** Whether multiple users are focused */
  hasMultipleFocus: boolean;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Construct a field ID for focus tracking
 *
 * @param companyId - The Convex ID of the company
 * @param entity - The entity type (e.g., "hiring", "leadership", "rankings")
 * @param fieldPath - The field path (e.g., "salary", "timeRecruiting")
 * @returns Field ID in format "companyId:entity:fieldPath"
 *
 * @example
 * ```ts
 * const fieldId = constructFieldId("company123", "hiring", "salary");
 * // Returns: "company123:hiring:salary"
 * ```
 */
export function constructFieldId(
  companyId: string,
  entity: string,
  fieldPath: string
): string {
  return `${companyId}:${entity}:${fieldPath}`;
}

/**
 * Hook for real-time field focus tracking
 *
 * @param companyId - The Convex ID of the company
 * @param entity - The entity type (e.g., "hiring", "leadership")
 * @param fieldPath - The field path (e.g., "salary", "commission")
 * @param userId - Current user's Convex ID
 * @returns Focus state and update functions
 *
 * @example
 * ```tsx
 * function HiringDecisionForm() {
 *   const user = useCurrentUser();
 *   const salaryFocus = useFocus(user.companyId, "hiring", "salary", user._id);
 *   const commissionFocus = useFocus(user.companyId, "hiring", "commission", user._id);
 *
 *   return (
 *     <form>
 *       <PresenceAwareInput
 *         label="Salary"
 *         onFocus={salaryFocus.updateFocus}
 *         onBlur={salaryFocus.clearFocus}
 *         focusedUsers={salaryFocus.focusedUsers}
 *       />
 *     </form>
 *   );
 * }
 * ```
 */
export function useFocus(
  companyId: Id<"companies"> | string | null | undefined,
  entity: string,
  fieldPath: string,
  userId: Id<"users"> | string | null | undefined
): UseFocusReturn {
  // Mutations
  const updateFocusMutation = useMutation(api.services.presenceFocus.updateFocus);
  const clearFocusMutation = useMutation(api.services.presenceFocus.clearFocus);

  // Construct field ID
  const fieldId =
    companyId && entity && fieldPath
      ? constructFieldId(companyId, entity, fieldPath)
      : null;

  // Query users focused on this field
  const focusedUsers = useQuery(
    api.services.presenceFocus.getFocusByField,
    fieldId ? { fieldId } : "skip"
  );

  // Update focus handler
  const handleUpdateFocus = useCallback(async () => {
    if (!fieldId || !userId) return;

    try {
      await updateFocusMutation({
        fieldId,
        userId: userId as Id<"users">,
      });
    } catch (error) {
      // Silently fail - focus updates are non-critical
    }
  }, [fieldId, userId, updateFocusMutation]);

  // Clear focus handler
  const handleClearFocus = useCallback(async () => {
    if (!userId) return;

    try {
      await clearFocusMutation({ userId: userId as Id<"users"> });
    } catch (error) {
      // Silently fail - focus updates are non-critical
    }
  }, [userId, clearFocusMutation]);

  // Cleanup focus on unmount
  useEffect(() => {
    return () => {
      // Clear focus when component unmounts
      if (userId) {
        clearFocusMutation({ userId: userId as Id<"users"> }).catch(() => {
          // Silently fail - cleanup doesn't need to report errors
        });
      }
    };
  }, [userId, clearFocusMutation]);

  const focusCount = focusedUsers?.length ?? 0;
  const hasMultipleFocus = focusCount > 1;

  return {
    focusedUsers: focusedUsers ?? [],
    updateFocus: handleUpdateFocus,
    clearFocus: handleClearFocus,
    focusCount,
    hasMultipleFocus,
    isLoading: focusedUsers === undefined,
  };
}
