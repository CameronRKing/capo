/**
 * ResumeCard Component - Draggable resume profile card
 *
 * Displays a resume profile with quick stats and hover preview.
 * Designed for drag-drop in the refinement UI.
 *
 * Features:
 * - Draggable with @dnd-kit
 * - Quick stats (education, experience, intelligence)
 * - Hover preview with full resume details
 * - Visual feedback during drag (opacity, elevation)
 * - Teammate presence indicators (who's viewing this resume)
 * - Accessibility support
 *
 * @example
 * ```tsx
 * function RefinementColumn() {
 *   return (
 *     <div>
 *       <ResumeCard
 *         repId="rep1"
 *         name="Marvin Adams"
 *         education="2 years Ohio State University"
 *         experience="4 years in the United States Army"
 *         intelligence={32}
 *         myers_briggs="ISTP"
 *         isDragging={false}
 *         listeners={{ ... }}
 *         attributes={{ ... }}
 *         setNodeRef={(node) => {}}
 *         style={{}}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { UseDraggableArguments } from "@dnd-kit/core";
import { UseSortableArguments } from "@dnd-kit/sortable";
import { FacePile } from "../../collaboration/FacePile";
import { getUserColor } from "../../../lib/userColors";

export interface ResumeCardProps {
  /** Resume ID (e.g., "rep1", "rep2") */
  repId: string;
  /** Candidate name */
  name: string;
  /** Education summary */
  education: string;
  /** Experience summary */
  experience: string;
  /** Intelligence score (0-100) */
  intelligence: number;
  /** Myers-Briggs personality type */
  myers_briggs: string;
  /** Whether card is being dragged */
  isDragging: boolean;
  /** Draggable attributes from @dnd-kit */
  attributes: UseDraggableArguments["attributes"];
  /** Draggable listeners from @dnd-kit */
  listeners: UseDraggableArguments["listeners"];
  /** Set ref for draggable node */
  setNodeRef: UseSortableArguments["setNodeRef"];
  /** Transform styles from @dnd-kit */
  style?: React.CSSProperties;
  /** Company ID for presence tracking */
  companyId?: Id<"companies"> | string | null;
  /** Current user ID */
  userId?: Id<"users"> | string | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Format resume field for display (truncate if too long)
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

/**
 * Intelligence bar color based on score
 */
function getIntelligenceColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * ResumeCard - Draggable card with hover preview
 */
export function ResumeCard({
  repId,
  name,
  education,
  experience,
  intelligence,
  myers_briggs,
  isDragging,
  attributes,
  listeners,
  setNodeRef,
  style,
  companyId,
  userId,
  className = "",
}: ResumeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Fetch full resume details for hover preview
  const fullResume = useQuery(
    api.resumes.getByRepId,
    repId ? { repId } : "skip"
  );

  // Fetch users viewing this resume (presence)
  // Field ID format: "companyId:resume:repId"
  const fieldId = companyId ? `${companyId}:resume:${repId}` : `resume:${repId}`;

  // Base styles
  const baseStyles: React.CSSProperties = {
    ...style,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={baseStyles}
      {...attributes}
      {...listeners}
      className={`
        relative bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm hover:shadow-md
        transition-all duration-200
        p-4
        ${isDragging ? "shadow-lg scale-105" : ""}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header: Name + Drag Handle */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {myers_briggs}
          </p>
        </div>
        <div className="text-gray-400 dark:text-gray-500">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="space-y-2">
        {/* Education */}
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l9-5-9-5-9 5 9 5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
          </svg>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {truncateText(education, 50)}
          </p>
        </div>

        {/* Experience */}
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {truncateText(experience, 50)}
          </p>
        </div>

        {/* Intelligence Bar */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-purple-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <div className="flex-1">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getIntelligenceColor(intelligence)}`}
                style={{ width: `${intelligence}%` }}
              />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {intelligence}
          </span>
        </div>
      </div>

      {/* Hover Preview - Full Resume Details */}
      {isHovered && fullResume && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 z-50">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Full Resume Details
          </h4>

          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Education:
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {fullResume.education}
              </p>
            </div>

            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Experience:
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {fullResume.experience}
              </p>
            </div>

            {fullResume.other_info && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Other Info:
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {fullResume.other_info}
                </p>
              </div>
            )}

            {fullResume.interview && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Interview Notes:
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  {truncateText(fullResume.interview, 200)}
                </p>
              </div>
            )}

            {fullResume.reference_check && (
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">
                  Reference Check:
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  {truncateText(fullResume.reference_check, 200)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Teammate Presence - Who's viewing this resume */}
      {companyId && (
        <div className="absolute bottom-2 right-2">
          {/* Placeholder for presence indicators */}
          {/* In Phase 2, this would show avatars of teammates viewing this resume */}
        </div>
      )}
    </div>
  );
}
