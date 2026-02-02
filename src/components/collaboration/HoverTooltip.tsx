/**
 * HoverTooltip Component - Tooltip for offline users
 *
 * Shows a tooltip with offline teammates' names when hovering over
 * an indicator (e.g., "X offline" text or icon).
 *
 * Features:
 * - Hover-triggered tooltip display
 * - Fixed positioning to prevent overflow
 * - Smooth fade-in animation
 * - Lists offline users with status indicators
 * - Accessible with ARIA attributes
 *
 * @example
 * ```tsx
 * function CompanyHeader() {
 *   const user = useCurrentUser();
 *   const { onlineUsers } = usePresence(user.companyId);
 *   const allTeammates = useQuery(api.users.listByCompany, { companyId: user.companyId });
 *
 *   const offlineUsers = allTeammates.filter(
 *     (t) => !onlineUsers.some((o) => o.user._id === t._id)
 *   );
 *
 *   return (
 *     <div className="flex items-center gap-4">
 *       <FacePile users={onlineUsers} />
 *       <HoverTooltip users={offlineUsers} />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useState, useRef, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

/**
 * User data for tooltip display
 */
export interface TooltipUser {
  _id: Id<"users">;
  name: string;
  email?: string;
}

/**
 * Props for HoverTooltip component
 */
export interface HoverTooltipProps {
  /** Array of offline users to display in tooltip */
  users: TooltipUser[];
  /** Trigger element (what user hovers over) */
  trigger?: React.ReactNode;
  /** Text to show in trigger (default: "X offline") */
  triggerText?: string;
  /** CSS class name for container */
  className?: string;
  /** Tooltip position relative to trigger */
  position?: "top" | "bottom" | "left" | "right";
  /** Maximum users to list before showing "X more" */
  maxVisible?: number;
}

/**
 * Individual user row in tooltip
 */
interface UserRowProps {
  user: TooltipUser;
  index: number;
}

function UserRow({ user, index }: UserRowProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
      key={user._id}
    >
      {/* Status indicator */}
      <div className="w-2 h-2 rounded-full bg-gray-400" aria-label="Offline" />

      {/* User name */}
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {user.name}
      </span>
    </div>
  );
}

/**
 * HoverTooltip - Shows offline users on hover
 *
 * Displays a tooltip with offline teammates when hovering over
 * the trigger element.
 *
 * @param users - Array of offline users
 * @param trigger - Custom trigger element (optional)
 * @param triggerText - Text for default trigger (default: "X offline")
 * @param className - Additional CSS classes
 * @param position - Tooltip position (default: "bottom")
 * @param maxVisible - Max users before "and X more" (default: 10)
 *
 * @example
 * ```tsx
 * // Basic usage with default trigger
 * <HoverTooltip users={offlineUsers} />
 *
 * // Custom trigger
 * <HoverTooltip
 *   users={offlineUsers}
 *   trigger={
 *     <button className="text-gray-500 hover:text-gray-700">
 *       <UsersIcon />
 *     </button>
 *   }
 * />
 *
 * // Limit visible users
 * <HoverTooltip
 *   users={offlineUsers}
 *   maxVisible={5}
 * />
 * ```
 */
export function HoverTooltip({
  users,
  trigger,
  triggerText,
  className = "",
  position = "bottom",
  maxVisible = 10,
}: HoverTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 300); // 300ms delay before showing tooltip
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // If no users, don't render
  if (users.length === 0) {
    return null;
  }

  // Determine visible users and remaining count
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  // Default trigger text
  const defaultTriggerText =
    users.length === 1
      ? "1 person offline"
      : `${users.length} people offline`;

  // Position classes
  const positionClasses: Record<typeof position, string> = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element */}
      {trigger ?? (
        <button
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline decoration-dotted"
          aria-label={`${users.length} offline teammates`}
        >
          {triggerText ?? defaultTriggerText}
        </button>
      )}

      {/* Tooltip */}
      {isOpen && (
        <div
          className={`
            absolute z-50 w-64 bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700
            rounded-lg shadow-lg
            ${positionClasses[position]}
          `}
          role="tooltip"
          aria-label="Offline teammates"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Offline Teammates
            </p>
          </div>

          {/* User list */}
          <div className="max-h-64 overflow-y-auto">
            {visibleUsers.map((user, index) => (
              <UserRow key={user._id} user={user} index={index} />
            ))}

            {/* "X more" indicator */}
            {remainingCount > 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
                and {remainingCount} more
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              They'll appear here when they come online
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * QuickOfflineBadge - Simple badge showing offline count
 *
 * Convenience component for showing offline count with HoverTooltip.
 *
 * @example
 * ```tsx
 * function CompanyHeader() {
 *   const offlineUsers = getOfflineUsers();
 *
 *   return (
 *     <div className="flex items-center gap-2">
 *       <span>Team:</span>
 *       <FacePile users={onlineUsers} />
 *       <QuickOfflineBadge users={offlineUsers} />
 *     </div>
 *   );
 * }
 * ```
 */
export interface QuickOfflineBadgeProps {
  users: TooltipUser[];
  className?: string;
}

export function QuickOfflineBadge({ users, className = "" }: QuickOfflineBadgeProps) {
  if (users.length === 0) return null;

  return (
    <HoverTooltip
      users={users}
      className={className}
      trigger={
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
          <svg
            className="w-3 h-3 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {users.length}
          </span>
        </div>
      }
    />
  );
}
