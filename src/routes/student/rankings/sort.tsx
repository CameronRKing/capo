/**
 * Resume Rough Sorting Page - Phase 1
 *
 * Students view unranked profiles one-by-one and assign to groups A/B/C.
 *
 * Features:
 * - Single-profile view (one resume shown at a time)
 * - A/B/C button group for assignment
 * - Progress bar showing position (e.g., "23 of 70 ranked")
 * - Navigation: Previous/Next buttons, skip profile option
 * - Resume display: name, education, experience, skills, interview notes
 * - Real-time collaboration: See teammates' rankings
 * - Presence indicators: Show who's viewing which profile
 *
 * @route /student/rankings/sort
 */

import React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRankings } from "@/hooks/useRankings";
import { ResumeCard } from "@/components/rankings/ResumeCard";
import { CompanyPresenceHeader } from "@/components/collaboration/CompanyPresenceHeader";

/**
 * Progress Bar Component
 *
 * Shows completion progress with visual bar and text.
 */
function ProgressBar({
  progress,
}: {
  progress: {
    total: number;
    ranked: number;
    unranked: number;
    percentComplete: number;
  } | null;
}) {
  if (!progress) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Sorting Progress
        </h3>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {progress.ranked} of {progress.total} ranked
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500 ease-out"
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {progress.ranked}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Ranked</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {progress.unranked}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Math.round(progress.percentComplete)}%
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Complete</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Group Assignment Buttons
 *
 * A/B/C buttons for assigning current resume to a group.
 */
function GroupButtons({
  onAssign,
  disabled,
}: {
  onAssign: (group: "A" | "B" | "C") => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <button
        onClick={() => onAssign("A")}
        disabled={disabled}
        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-xl transition-colors"
      >
        Group A
        <div className="text-xs font-normal mt-1">Top Tier</div>
      </button>

      <button
        onClick={() => onAssign("B")}
        disabled={disabled}
        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-xl transition-colors"
      >
        Group B
        <div className="text-xs font-normal mt-1">Middle Tier</div>
      </button>

      <button
        onClick={() => onAssign("C")}
        disabled={disabled}
        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-6 px-8 rounded-lg text-xl transition-colors"
      >
        Group C
        <div className="text-xs font-normal mt-1">Lower Tier</div>
      </button>
    </div>
  );
}

/**
 * Navigation Controls
 *
 * Previous/Next/Skip buttons for navigating resumes.
 */
function NavigationControls({
  currentIndex,
  total,
  onPrevious,
  onNext,
  onSkip,
  canGoPrevious,
  canGoNext,
}: {
  currentIndex: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
      >
        ← Previous
      </button>

      <div className="text-sm text-gray-600 dark:text-gray-400">
        Resume {currentIndex + 1} of {total}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSkip}
          disabled={!canGoNext}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
        >
          Skip
        </button>

        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/**
 * Teammate Rankings Summary
 *
 * Shows read-only view of teammates' rankings.
 */
function TeammateRankings({
  rankings,
}: {
  rankings: Record<
    string,
    {
      userName: string;
      rankings: {
        A: Array<{ repId: string; rank: number }>;
        B: Array<{ repId: string; rank: number }>;
        C: Array<{ repId: string; rank: number }>;
      };
    }
  > | null;
}) {
  if (!rankings || Object.keys(rankings).length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Teammate Rankings
      </h3>

      <div className="space-y-4">
        {Object.entries(rankings).map(([userId, data]) => (
          <div
            key={userId}
            className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {data.userName}
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {data.rankings.A.length + data.rankings.B.length + data.rankings.C.length}{" "}
                ranked
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                <div className="font-medium text-green-700 dark:text-green-400">
                  A: {data.rankings.A.length}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">
                <div className="font-medium text-yellow-700 dark:text-yellow-400">
                  B: {data.rankings.B.length}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded p-2">
                <div className="font-medium text-red-700 dark:text-red-400">
                  C: {data.rankings.C.length}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Completion State
 *
 * Shows when all resumes have been ranked.
 */
function CompletionState({
  onReset,
  rankings,
}: {
  onReset: () => void;
  rankings: {
    A: Array<{ repId: string; rank: number }>;
    B: Array<{ repId: string; rank: number }>;
    C: Array<{ repId: string; rank: number }>;
  } | null;
}) {
  if (!rankings) return null;

  const total = (rankings.A?.length || 0) + (rankings.B?.length || 0) + (rankings.C?.length || 0);

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-2">
        Congratulations!
      </h2>
      <p className="text-green-700 dark:text-green-400 mb-6">
        You've ranked all {total} resumes.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {rankings.A?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Group A</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
            {rankings.B?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Group B</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
            {rankings.C?.length || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Group C</div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
      >
        Continue to Refinement Phase
      </button>
    </div>
  );
}

/**
 * Rough Sorting Page Component
 */
export function RoughSortingPage() {
  const user = useCurrentUser();
  const {
    myRankings,
    unrankedResumes,
    currentResume,
    currentIndex,
    progress,
    assignToGroup,
    nextResume,
    previousResume,
    skipResume,
    isLoading,
  } = useRankings(user?.companyId ?? null);

  // Get teammate rankings for collaboration
  const teammateRankings = useQuery(
    api.myFunctions.domain.rankings.getTeammateRankings,
    user?.companyId ? { companyId: user.companyId } : "skip"
  );

  // Filter out current user from teammate rankings
  const otherRankings =
    teammateRankings && user
      ? Object.fromEntries(
          Object.entries(teammateRankings).filter(([userId]) => userId !== user._id)
        )
      : null;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  // All resumes ranked
  if (!currentResume && progress && progress.unranked === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <CompletionState
          onReset={() => window.location.assign("/student/rankings/refine")}
          rankings={myRankings}
        />
        <TeammateRankings rankings={otherRankings} />
      </div>
    );
  }

  // No resumes available
  if (!currentResume && progress && progress.total === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
            No Resumes Available
          </h2>
          <p className="text-yellow-700 dark:text-yellow-400">
            Please check back later or contact your instructor.
          </p>
        </div>
      </div>
    );
  }

  const totalResumes = unrankedResumes?.length ?? 0;
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalResumes - 1;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with presence */}
      {user?.companyId && (
        <CompanyPresenceHeader
          companyId={user.companyId}
          title="Resume Ranking - Rough Sorting"
          subtitle="Assign each resume to a group (A/B/C) based on qualifications"
        />
      )}

      {/* Progress bar */}
      <ProgressBar progress={progress} />

      {/* Navigation */}
      {totalResumes > 0 && (
        <div className="mb-6">
          <NavigationControls
            currentIndex={currentIndex}
            total={totalResumes}
            onPrevious={previousResume}
            onNext={nextResume}
            onSkip={skipResume}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
          />
        </div>
      )}

      {/* Resume card */}
      {currentResume && (
        <div className="mb-6">
          <ResumeCard resume={currentResume} />
        </div>
      )}

      {/* Group assignment buttons */}
      {currentResume && (
        <div className="mb-6">
          <GroupButtons
            onAssign={async (group) => {
              await assignToGroup(group);
            }}
          />
        </div>
      )}

      {/* Teammate rankings */}
      <TeammateRankings rankings={otherRankings} />
    </div>
  );
}

/**
 * Route definition using TanStack Router file-based routing
 */
export const Route = createFileRoute("/student/rankings/sort")({
  component: RoughSortingPage,
});
