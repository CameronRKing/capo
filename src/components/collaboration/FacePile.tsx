/**
 * FacePile Component - Avatar stack for online users
 *
 * Displays overlapping circular avatars for users present in a room.
 * Provides fixed-size container to prevent layout shift when users join/leave.
 *
 * Features:
 * - Fixed-size container (prevents layout shift)
 * - Circular avatars with user initials or images
 * - Overlapping stack design
 * - Hover tooltip showing user name
 * - Accessibility support with ARIA labels
 * - Configurable max avatars before showing "+N" indicator
 *
 * @example
 * ```tsx
 * function CompanyHeader() {
 *   const { onlineUsers } = usePresence(companyId);
 *
 *   return (
 *     <div className="flex items-center gap-4">
 *       <h2>Company A</h2>
 *       <FacePile users={onlineUsers} maxVisible={5} />
 *       <span className="text-sm text-gray-500">
 *         {onlineUsers.length} online
 *       </span>
 *     </div>
 *   );
 * }
 * ```
 */

import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { getUserColor } from "../../lib/userColors";

/**
 * User data for FacePile
 */
export interface FacePileUser {
  user: {
    _id: Id<"users">;
    name: string;
    email?: string;
  };
  [key: string]: any;
}

/**
 * Props for FacePile component
 */
export interface FacePileProps {
  /** Array of online users to display */
  users: FacePileUser[];
  /** Maximum number of avatars to show before "+N" */
  maxVisible?: number;
  /** Size of each avatar in pixels */
  size?: number;
  /** CSS class name for container */
  className?: string;
  /** Whether to show tooltips on hover */
  showTooltips?: boolean;
}

/**
 * Generate initials from user name
 *
 * @param name - User's full name
 * @returns 1-2 character initials
 *
 * @example
 * ```ts
 * getInitials("John Doe") // "JD"
 * getInitials("Maria") // "M"
 * ```
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Individual avatar component
 */
interface AvatarProps {
  user: FacePileUser;
  size: number;
  showTooltip?: boolean;
  style?: React.CSSProperties;
}

function Avatar({ user, size, showTooltip, style }: AvatarProps) {
  const initials = getInitials(user.user.name);
  const backgroundColor = getUserColor(user.user._id);

  return (
    <div
      className="relative flex items-center justify-center rounded-full text-white font-semibold text-sm border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-10"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor,
        fontSize: `${size * 0.4}px`,
        ...style,
      }}
      title={showTooltip ? user.user.name : undefined}
      aria-label={`${user.user.name} is online`}
    >
      {initials}
    </div>
  );
}

/**
 * "+N" indicator for additional users
 */
interface MoreIndicatorProps {
  count: number;
  size: number;
}

function MoreIndicator({ count, size }: MoreIndicatorProps) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold text-sm border-2 border-white shadow-sm"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${size * 0.35}px`,
      }}
      aria-label={`${count} more users online`}
    >
      +{count}
    </div>
  );
}

/**
 * FacePile - Stack of user avatars showing online users
 *
 * Displays avatars in a horizontal overlapping stack with fixed container
 * size to prevent layout shift when users join or leave.
 *
 * @param users - Array of online users
 * @param maxVisible - Maximum avatars to show (default: 5)
 * @param size - Avatar size in pixels (default: 32)
 * @param className - Additional CSS classes
 * @param showTooltips - Show user name on hover (default: true)
 *
 * @example
 * ```tsx
 * <FacePile
 *   users={onlineUsers}
 *   maxVisible={5}
 *   size={32}
 *   className="mt-2"
 * />
 * ```
 */
export function FacePile({
  users,
  maxVisible = 5,
  size = 32,
  className = "",
  showTooltips = true,
}: FacePileProps) {
  // Display fixed-size container to prevent layout shift
  const containerHeight = size;
  const overlapOffset = size * 0.4; // Overlap by 40% of avatar size
  const containerWidth =
    size + Math.min(users.length, maxVisible) * overlapOffset;

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div
      className={`flex items-center ${className}`}
      style={{
        height: `${containerHeight}px`,
        minWidth: `${containerWidth}px`,
      }}
      aria-label={`${users.length} users online`}
    >
      {visibleUsers.map((user, index) => (
        <div
          key={user.user._id}
          className="-ml-3 first:ml-0"
          style={{
            marginLeft: index === 0 ? 0 : `${-overlapOffset}px`,
          }}
        >
          <Avatar
            user={user}
            size={size}
            showTooltip={showTooltips}
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className="-ml-3"
          style={{ marginLeft: `${-overlapOffset}px` }}
        >
          <MoreIndicator count={remainingCount} size={size} />
        </div>
      )}

      {users.length === 0 && (
        <div
          className="text-xs text-gray-400"
          style={{ height: `${size}px`, lineHeight: `${size}px` }}
        >
          No one online
        </div>
      )}
    </div>
  );
}
