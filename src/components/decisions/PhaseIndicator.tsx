/**
 * PhaseIndicator Component
 *
 * Displays the current quarter, phase, and submission status.
 * Shows visual indicators for:
 * - Current quarter number
 * - Current phase (hiring/leadership)
 * - Game status (setup/active/completed)
 * - Submission status (submitted/not submitted)
 * - Time remaining (optional, for future implementation)
 *
 * @example
 * ```tsx
 * <PhaseIndicator
 *   quarter={1}
 *   phase="hiring"
 *   gameStatus="active"
 *   submissionStatus={{ isSubmitted: true, submittedBy: "...", submittedAt: ... }}
 * />
 * ```
 */

import React from "react";
import { Id } from "@convex/_generated/dataModel";

// =====================================================
// Types & Interfaces
// =====================================================

export interface PhaseIndicatorProps {
  /** The current quarter number */
  quarter: number;
  /** The current phase ("hiring" | "leadership") */
  phase: "hiring" | "leadership";
  /** The overall game status */
  gameStatus: "setup" | "active" | "completed";
  /** Submission status object */
  submissionStatus: {
    isSubmitted: boolean;
    submittedBy?: Id<"users">;
    submittedAt?: number;
  } | null | undefined;
}

// =====================================================
// Helper Components
// =====================================================

/**
 * Phase Badge Component
 *
 * Displays a colored badge for the current phase.
 */
function PhaseBadge({ phase }: { phase: "hiring" | "leadership" }) {
  const badgeConfig = {
    hiring: {
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-800 dark:text-green-300",
      borderColor: "border-green-200 dark:border-green-800",
      label: "Hiring Phase",
    },
    leadership: {
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      textColor: "text-purple-800 dark:text-purple-300",
      borderColor: "border-purple-200 dark:border-purple-800",
      label: "Leadership Phase",
    },
  };

  const config = badgeConfig[phase];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      {config.label}
    </span>
  );
}

/**
 * Submission Status Indicator Component
 *
 * Shows whether decisions have been submitted.
 */
function SubmissionStatus({
  submissionStatus,
}: {
  submissionStatus: PhaseIndicatorProps["submissionStatus"];
}) {
  if (!submissionStatus) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Loading submission status...</span>
      </div>
    );
  }

  if (submissionStatus.isSubmitted) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <svg
          className="w-5 h-5 text-green-600 dark:text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-green-700 dark:text-green-300 font-medium">
          Submitted
        </span>
        {submissionStatus.submittedAt && (
          <span className="text-gray-500 dark:text-gray-400">
            on {new Date(submissionStatus.submittedAt).toLocaleString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <svg
        className="w-5 h-5 text-yellow-600 dark:text-yellow-400"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-yellow-700 dark:text-yellow-300 font-medium">
        Not Submitted
      </span>
    </div>
  );
}

/**
 * Game Status Badge Component
 *
 * Displays the overall game status.
 */
function GameStatusBadge({
  status,
}: {
  status: "setup" | "active" | "completed";
}) {
  const statusConfig = {
    setup: {
      bgColor: "bg-gray-100 dark:bg-gray-800",
      textColor: "text-gray-800 dark:text-gray-300",
      label: "Setup",
    },
    active: {
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      textColor: "text-blue-800 dark:text-blue-300",
      label: "Active",
    },
    completed: {
      bgColor: "bg-green-100 dark:bg-green-900/30",
      textColor: "text-green-800 dark:text-green-300",
      label: "Completed",
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}

// =====================================================
// Main Component
// =====================================================

/**
 * PhaseIndicator Component
 *
 * Main component that displays all phase-related information.
 */
export function PhaseIndicator({
  quarter,
  phase,
  gameStatus,
  submissionStatus,
}: PhaseIndicatorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Quarter and Phase */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quarter {quarter}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <PhaseBadge phase={phase} />
              <GameStatusBadge status={gameStatus} />
            </div>
          </div>
        </div>

        {/* Right: Submission Status */}
        <div className="flex items-center">
          <SubmissionStatus submissionStatus={submissionStatus} />
        </div>
      </div>

      {/* Progress Bar (Optional - visual representation of quarter) */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress</span>
          <span>Q{quarter}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min((quarter / 8) * 100, 100)}%`, // Assuming 8 quarters max
            }}
          />
        </div>
      </div>
    </div>
  );
}
