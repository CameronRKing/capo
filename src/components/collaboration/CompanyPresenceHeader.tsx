/**
 * CompanyPresenceHeader Component - Header with company room presence
 *
 * Displays online teammates in a company room with:
 * - Company name and info
 * - FacePile of online users
 * - Online user count
 * - HoverTooltip for offline teammates (on hover)
 * - Fixed-size container (no layout shift)
 *
 * Features:
 * - Real-time presence updates
 * - Fixed-size container prevents layout shift
 * - Shows online count
 * - Optional offline teammates list on hover
 * - Responsive design
 *
 * @example
 * ```tsx
 * function DecisionPage() {
 *   const user = useCurrentUser();
 *   const company = useQuery(api.companies.get, { id: user.companyId });
 *
 *   return (
 *     <div>
 *       <CompanyPresenceHeader
 *         companyId={user.companyId}
 *         companyName={company?.name}
 *         showOfflineTooltip={true}
 *       />
 *       <DecisionForm />
 *     </div>
 *   );
 * }
 * ```
 */

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { usePresence } from "../../hooks/usePresence";
import { FacePile } from "./FacePile";

export interface CompanyPresenceHeaderProps {
  /** The company ID for presence room */
  companyId: Id<"companies"> | string | null | undefined;
  /** Company name to display */
  companyName?: string;
  /** Whether to show offline teammates on hover (default: false) */
  showOfflineTooltip?: boolean;
  /** Additional CSS classes for container */
  className?: string;
  /** Size of avatars in FacePile (default: 32) */
  avatarSize?: number;
  /** Maximum avatars to show (default: 5) */
  maxAvatars?: number;
}

/**
 * CompanyPresenceHeader - Shows company info and online teammates
 *
 * Displays a header with:
 * - Company name
 * - FacePile of online users
 * - Online count
 * - Optional offline teammates tooltip
 *
 * @param companyId - Company ID for presence tracking
 * @param companyName - Optional company name display
 * @param showOfflineTooltip - Show offline users on hover
 * @param className - Additional CSS classes
 * @param avatarSize - Avatar size in pixels
 * @param maxAvatars - Maximum avatars before "+N"
 */
export function CompanyPresenceHeader({
  companyId,
  companyName,
  showOfflineTooltip = false,
  className = "",
  avatarSize = 32,
  maxAvatars = 5,
}: CompanyPresenceHeaderProps) {
  // Presence tracking
  const { onlineUsers, onlineCount, isLoading } = usePresence(companyId);

  // Get all company members (for offline tooltip)
  const allMembers = useQuery(
    api.users.listByCompany,
    companyId ? { companyId: companyId as Id<"companies"> } : "skip"
  );

  // Calculate offline users
  const onlineUserIds = new Set(onlineUsers.map((u) => u.user._id));
  const offlineUsers = (allMembers ?? []).filter(
    (member) => !onlineUserIds.has(member._id)
  );

  // Fixed container height to prevent layout shift
  const containerHeight = avatarSize + 8; // avatar size + padding

  return (
    <div
      className={`flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      style={{ minHeight: `${containerHeight}px` }}
    >
      {/* Company Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {companyName || "Company Dashboard"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? (
              "Loading presence..."
            ) : (
              <>
                {onlineCount} {onlineCount === 1 ? "teammate" : "teammates"} online
              </>
            )}
          </p>
        </div>
      </div>

      {/* Online Users FacePile */}
      <div className="flex items-center gap-4">
        {showOfflineTooltip && offlineUsers.length > 0 && (
          <OfflineTooltip offlineUsers={offlineUsers} />
        )}

        <FacePile
          users={onlineUsers}
          maxVisible={maxAvatars}
          size={avatarSize}
        />
      </div>
    </div>
  );
}

/**
 * OfflineTooltip - Shows offline teammates on hover
 *
 * Displays a tooltip with list of offline users when hovered.
 */
interface OfflineTooltipProps {
  offlineUsers: Array<{ _id: Id<"users">; name: string; email: string }>;
}

function OfflineTooltip({ offlineUsers }: OfflineTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Button/Indicator */}
      <button
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label={`${offlineUsers.length} offline teammates`}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clipRule="evenodd"
          />
        </svg>
        <span>{offlineUsers.length} offline</span>
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
              Offline Teammates
            </h3>
            <ul className="space-y-1">
              {offlineUsers.map((user) => (
                <li
                  key={user._id}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 py-1"
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span>{user.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Import useState for the component
import { useState } from "react";
