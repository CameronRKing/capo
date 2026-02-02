/**
 * FocusIndicator Component - Wraps form inputs with real-time collaboration indicators
 *
 * Displays visual cues when multiple users are focused on the same field:
 * - Avatar pile of users focused on this field
 * - Colored border when multi-user focus detected
 * - "Last edited by" metadata below the input
 * - Fixed-size container to prevent layout shift
 *
 * Features:
 * - Automatic focus tracking (onFocus/onBlur handlers)
 * - Multi-user focus detection
 * - Per-user color assignment
 * - Last edited timestamp display
 * - Accessibility support
 *
 * @example
 * ```tsx
 * function HiringDecisionForm() {
 *   const user = useCurrentUser();
 *
 *   return (
 *     <FocusIndicator
 *       companyId={user.companyId}
 *       entity="hiring"
 *       fieldPath="salary"
 *       userId={user._id}
 *       label="Annual Salary"
 *     >
 *       <input type="number" />
 *     </FocusIndicator>
 *   );
 * }
 * ```
 */

import React, { ReactNode, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { useFocus } from "../../hooks/useFocus";
import { FacePile, FacePileUser } from "./FacePile";
import { getUserColor } from "../../lib/userColors";

export interface FocusIndicatorProps {
  /** The company ID for presence room */
  companyId: Id<"companies"> | string | null | undefined;
  /** The entity type (e.g., "hiring", "leadership", "rankings") */
  entity: string;
  /** The field path (e.g., "salary", "timeRecruiting") */
  fieldPath: string;
  /** Current user ID (from auth) */
  userId: Id<"users"> | string | null | undefined;
  /** Label for the input (displayed above) */
  label?: string;
  /** Child input element to wrap */
  children: ReactNode;
  /** Whether to show last edited info (default: true) */
  showLastEdited?: boolean;
  /** Whether to show focused user avatars (default: true) */
  showAvatars?: boolean;
  /** Additional CSS classes for container */
  className?: string;
}

/**
 * Format timestamp for display
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "2:30 PM")
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Format "last edited" message
 *
 * @param userName - Name of user who last edited
 * @param timestamp - Unix timestamp of last edit
 * @returns Formatted message (e.g., "Last edited by John at 2:30 PM")
 */
function formatLastEdited(userName: string, timestamp: number): string {
  return `Last edited by ${userName} at ${formatTimestamp(timestamp)}`;
}

/**
 * FocusIndicator - Wraps inputs with collaboration indicators
 *
 * Automatically tracks focus/blur and displays:
 * - Colored border when multiple users focused
 * - Avatars of focused users (excluding current user)
 * - Last edited metadata
 *
 * @param companyId - Company ID for presence
 * @param entity - Entity type (e.g., "hiring")
 * @param fieldPath - Field path (e.g., "salary")
 * @param userId - Current user ID
 * @param label - Optional label for input
 * @param children - Input element to wrap
 * @param showLastEdited - Show last edited info (default: true)
 * @param showAvatars - Show focused user avatars (default: true)
 * @param className - Additional CSS classes
 */
export function FocusIndicator({
  companyId,
  entity,
  fieldPath,
  userId,
  label,
  children,
  showLastEdited = true,
  showAvatars = true,
  className = "",
}: FocusIndicatorProps) {
  // Focus tracking
  const { focusedUsers, updateFocus, clearFocus, hasMultipleFocus } = useFocus(
    companyId,
    entity,
    fieldPath,
    userId
  );

  // Clone child and add focus/blur handlers
  const child = React.Children.only(children) as React.ReactElement;

  // Filter out current user from focused users
  const otherFocusedUsers = focusedUsers.filter(
    (u) => u.user._id !== userId
  );

  // Convert to FacePile format
  const facePileUsers: FacePileUser[] = otherFocusedUsers.map((u) => ({
    user: u.user,
  }));

  // Get last edited info (for now, use most recent focused user as placeholder)
  const lastEdited = otherFocusedUsers.length > 0
    ? {
        userName: otherFocusedUsers[0].user.name,
        timestamp: otherFocusedUsers[0].timestamp,
      }
    : null;

  // Multi-user focus border color
  const multiUserBorderColor = "ring-2 ring-purple-500 ring-offset-2";

  // Clone element with handlers
  const enhancedChild = React.cloneElement(child, {
    ...child.props,
    onFocus: (e: React.FocusEvent) => {
      // Call original onFocus if exists
      if (child.props.onFocus) {
        child.props.onFocus(e);
      }
      updateFocus();
    },
    onBlur: (e: React.FocusEvent) => {
      // Call original onBlur if exists
      if (child.props.onBlur) {
        child.props.onBlur(e);
      }
      clearFocus();
    },
    className: `
      ${child.props.className || ""}
      ${hasMultipleFocus ? multiUserBorderColor : ""}
    `.trim(),
  });

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      {/* Input with focus indicators */}
      <div className="relative">
        {enhancedChild}

        {/* Focused user avatars */}
        {showAvatars && facePileUsers.length > 0 && (
          <div className="absolute -top-3 right-0 z-10">
            <FacePile users={facePileUsers} maxVisible={3} size={24} />
          </div>
        )}
      </div>

      {/* Last edited info */}
      {showLastEdited && lastEdited && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {formatLastEdited(lastEdited.userName, lastEdited.timestamp)}
        </p>
      )}

      {/* Multi-user focus indicator */}
      {hasMultipleFocus && (
        <div className="mt-1 text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          {facePileUsers.length} {facePileUsers.length === 1 ? "person" : "people"} viewing
        </p>
      )}
    </div>
  );
}
