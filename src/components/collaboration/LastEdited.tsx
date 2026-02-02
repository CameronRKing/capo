/**
 * LastEdited Component - Display "Last edited by <user> at <time>"
 *
 * Shows metadata about when a field was last edited and by whom.
 * Displays below input fields or form sections to provide context.
 *
 * Features:
 * - Formatted timestamp display
 * - User name display
 * - Relative time option ("2 minutes ago")
 * - Automatic timestamp updates
 * - Optional user avatar
 *
 * @example
 * ```tsx
 * function DecisionForm() {
 *   const [lastEdited, setLastEdited] = useState<{
 *     userName: string;
 *     timestamp: number;
 *   } | null>(null);
 *
 *   const handleChange = async (value: string) => {
 *     await saveDraft(value);
 *     setLastEdited({
 *       userName: currentUser.name,
 *       timestamp: Date.now(),
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <input onChange={(e) => handleChange(e.target.value)} />
 *       <LastEdited data={lastEdited} />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useEffect, useState } from "react";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Last edited metadata
 */
export interface LastEditedData {
  userName: string;
  timestamp: number;
  userId?: Id<"users">;
}

/**
 * Props for LastEdited component
 */
export interface LastEditedProps {
  /** Last edited metadata */
  data: LastEditedData | null;
  /** Whether to show relative time (default: true) */
  showRelative?: boolean;
  /** Whether to show exact time (default: false) */
  showExact?: boolean;
  /** Whether to show user avatar (default: false) */
  showAvatar?: boolean;
  /** CSS class name for container */
  className?: string;
  /** Custom prefix text (default: "Last edited by") */
  prefix?: string;
}

/**
 * Format timestamp as localized time
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time string (e.g., "2:30:45 PM")
 */
function formatExactTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Format relative time (e.g., "2 minutes ago")
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Relative time string
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
  } else if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  } else if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  } else {
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
}

/**
 * Get user initials for avatar
 *
 * @param userName - User's full name
 * @returns 1-2 character initials
 */
function getInitials(userName: string): string {
  const parts = userName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * LastEdited - Display last edited metadata
 *
 * Shows "Last edited by <user> at <time>" or relative time below inputs.
 * Auto-updates relative time every minute.
 *
 * @param data - Last edited metadata (null = not edited yet)
 * @param showRelative - Show relative time (default: true)
 * @param showExact - Show exact time (default: false)
 * @param showAvatar - Show user avatar (default: false)
 * @param className - Additional CSS classes
 * @param prefix - Custom prefix text (default: "Last edited by")
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LastEdited
 *   data={{
 *     userName: "Alice Johnson",
 *     timestamp: Date.now(),
 *   }}
 * />
 *
 * // With relative and exact time
 * <LastEdited
 *   data={lastEdited}
 *   showRelative={true}
 *   showExact={true}
 * />
 *
 * // With avatar
 * <LastEdited
 *   data={lastEdited}
 *   showAvatar={true}
 * />
 * ```
 */
export function LastEdited({
  data,
  showRelative = true,
  showExact = false,
  showAvatar = false,
  className = "",
  prefix = "Last edited by",
}: LastEditedProps) {
  // State for auto-updating relative time
  const [, forceUpdate] = useState(0);

  // Update relative time every minute
  useEffect(() => {
    if (!data || !showRelative) return;

    const interval = setInterval(() => {
      forceUpdate((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [data, showRelative]);

  // If no data, don't render
  if (!data) {
    return null;
  }

  const { userName, timestamp } = data;
  const initials = getInitials(userName);

  return (
    <div
      className={`flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}
      aria-label={`${prefix} ${userName} at ${new Date(timestamp).toLocaleString()}`}
    >
      {/* Avatar */}
      {showAvatar && (
        <div
          className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-semibold"
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      {/* Text */}
      <span>
        {prefix} <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>

        {showRelative && (
          <>
            {" "}
            <span className="text-gray-600 dark:text-gray-500">
              ({formatRelativeTime(timestamp)})
            </span>
          </>
        )}

        {showExact && (
          <>
            {" "}
            <span className="text-gray-600 dark:text-gray-500" aria-label="Exact time">
              at {formatExactTime(timestamp)}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

/**
 * LastEditedCompact - Minimal version with just relative time
 *
 * Convenience component for compact display.
 *
 * @example
 * ```tsx
 * <LastEditedCompact
 *   userName="Alice"
 *   timestamp={Date.now()}
 * />
 * // Displays: "Alice • 2 minutes ago"
 * ```
 */
export interface LastEditedCompactProps {
  userName: string;
  timestamp: number;
  className?: string;
  separator?: string; // Default: "•"
}

export function LastEditedCompact({
  userName,
  timestamp,
  className = "",
  separator = "•",
}: LastEditedCompactProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => forceUpdate((prev) => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`text-xs text-gray-500 dark:text-gray-400 ${className}`}
      aria-label={`Last edited by ${userName} ${formatRelativeTime(timestamp)}`}
    >
      <span className="font-medium text-gray-700 dark:text-gray-300">{userName}</span>
      {" "}{separator}{" "}
      <span>{formatRelativeTime(timestamp)}</span>
    </div>
  );
}

/**
 * useLastEdited Hook - Manages last edited state
 *
 * Convenience hook for tracking last edited metadata.
 *
 * @example
 * ```tsx
 * function MyForm() {
 *   const { lastEdited, updateLastEdited } = useLastEdited();
 *
 *   const handleChange = async (value: string) => {
 *     await saveField(value);
 *     updateLastEdited("Alice");
 *   };
 *
 *   return (
 *     <div>
 *       <input onChange={handleChange} />
 *       <LastEdited data={lastEdited} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useLastEdited() {
  const [lastEdited, setLastEdited] = useState<LastEditedData | null>(null);

  const updateLastEdited = (userName: string, userId?: Id<"users">) => {
    setLastEdited({
      userName,
      timestamp: Date.now(),
      userId,
    });
  };

  const clearLastEdited = () => {
    setLastEdited(null);
  };

  return {
    lastEdited,
    updateLastEdited,
    clearLastEdited,
  };
}
