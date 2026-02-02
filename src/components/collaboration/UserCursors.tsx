/**
 * UserCursors Component - Real-time cursor tracking for multi-user collaboration
 *
 * Displays other users' cursor positions on the page with colored labels.
 * Shows a colored pointer with user name following their mouse movement.
 *
 * Features:
 * - Per-user color assignment (consistent with avatars)
 * - Smooth cursor movement animation
 * - User name label above cursor
 * - Fixed positioning relative to viewport
 * - Z-index management to avoid overlapping content
 * - Real-time updates via presence service
 *
 * @example
 * ```tsx
 * function DecisionForm() {
 *   const user = useCurrentUser();
 *   const { onlineUsers } = usePresence(user.companyId);
 *   const [cursors, setCursors] = useState<Map<string, {x: number, y: number}>>(new Map());
 *
 *   // Track own cursor movement
 *   useEffect(() => {
 *     const handleMouseMove = (e: MouseEvent) => {
 *       broadcastCursorPosition(user._id, e.clientX, e.clientY);
 *     };
 *     window.addEventListener('mousemove', handleMouseMove);
 *     return () => window.removeEventListener('mousemove', handleMouseMove);
 *   }, [user._id]);
 *
 *   return (
 *     <div className="relative">
 *       <UserCursors users={onlineUsers} cursors={cursors} />
 *       {/* Form content *\/}
 *     </div>
 *   );
 * }
 * ```
 */

import React from "react";
import { Id } from "../../convex/_generated/dataModel";
import { getUserColor } from "../../lib/userColors";

/**
 * Cursor position data
 */
export interface CursorPosition {
  x: number;
  y: number;
  timestamp?: number;
}

/**
 * User data for cursor display
 */
export interface CursorUser {
  user: {
    _id: Id<"users">;
    name: string;
    email?: string;
  };
  [key: string]: any;
}

/**
 * Props for UserCursors component
 */
export interface UserCursorsProps {
  /** Array of online users (excluding current user) */
  users: CursorUser[];
  /** Map of user ID to cursor position */
  cursors: Map<string | Id<"users">, CursorPosition>;
  /** Current user's ID (to exclude from display) */
  currentUserId?: Id<"users"> | string;
  /** CSS class name for container */
  className?: string;
  /** Whether to hide cursor labels */
  hideLabels?: boolean;
}

/**
 * Individual cursor component
 */
interface CursorProps {
  user: CursorUser;
  position: CursorPosition;
  hideLabel?: boolean;
}

function Cursor({ user, position, hideLabel }: CursorProps) {
  const color = getUserColor(user.user._id);
  const userName = user.user.name;

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-75 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(4px, 4px)",
      }}
      aria-label={`${userName}'s cursor`}
    >
      {/* Cursor pointer */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* User name label */}
      {!hideLabel && (
        <div
          className="absolute left-6 top-0 px-2 py-0.5 rounded text-xs font-semibold text-white whitespace-nowrap"
          style={{
            backgroundColor: color,
          }}
        >
          {userName}
        </div>
      )}
    </div>
  );
}

/**
 * UserCursors - Display other users' cursor positions on page
 *
 * Shows colored cursor pointers with name labels for all online users
 * except the current user. Positioned fixed relative to viewport.
 *
 * **Note**: This component requires cursor position broadcasting to be
 * implemented. For MVP, cursor tracking is a visual placeholder that
 * can be integrated with a real-time cursor sync service (future enhancement).
 *
 * @param users - Array of online users
 * @param cursors - Map of user ID to cursor position
 * @param currentUserId - Current user's ID (excluded from display)
 * @param className - Additional CSS classes
 * @param hideLabels - Hide user name labels (default: false)
 *
 * @example
 * ```tsx
 * // Basic usage with cursor state
 * const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
 *
 * // In your component with mouse tracking:
 * <UserCursors
 *   users={onlineUsers.filter(u => u.user._id !== currentUser._id)}
 *   cursors={cursors}
 *   currentUserId={currentUser._id}
 * />
 * ```
 */
export function UserCursors({
  users,
  cursors,
  currentUserId,
  className = "",
  hideLabels = false,
}: UserCursorsProps) {
  // Filter out current user and users without cursor positions
  const visibleCursors = users
    .filter((u) => u.user._id !== currentUserId)
    .filter((u) => cursors.has(u.user._id))
    .map((user) => ({
      user,
      position: cursors.get(user.user._id)!,
    }));

  if (visibleCursors.length === 0) {
    return null;
  }

  return (
    <div className={`UserCursors ${className}`} aria-live="polite">
      {visibleCursors.map(({ user, position }) => (
        <Cursor
          key={user.user._id}
          user={user}
          position={position}
          hideLabel={hideLabels}
        />
      ))}
    </div>
  );
}

/**
 * Hook to broadcast cursor position to other users
 *
 * **Note**: This is a placeholder for future implementation.
 * Requires a real-time cursor broadcasting service via Convex.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const user = useCurrentUser();
 *   const broadcastCursor = useCursorBroadcast(user._id);
 *
 *   useEffect(() => {
 *     const handleMouseMove = (e: MouseEvent) => {
 *       broadcastCursor(e.clientX, e.clientY);
 *     };
 *     window.addEventListener('mousemove', handleMouseMove);
 *     return () => window.removeEventListener('mousemove', handleMouseMove);
 *   }, [broadcastCursor]);
 * }
 * ```
 */
export function useCursorBroadcast(
  userId: Id<"users"> | string
): ((x: number, y: number) => void) | null {
  // Placeholder: In production, this would use Convex mutations
  // to broadcast cursor position to other users in the room
  // For MVP, this returns null (no-op)
  return null;
}
