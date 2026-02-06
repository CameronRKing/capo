/**
 * Decisions Index Route - /student/decisions
 *
 * Dynamic routing that directs students to the correct decision form
 * based on the current game phase (hiring vs leadership).
 *
 * Routing Logic:
 * - If phase = "hiring" → show hiring decision form
 * - If phase = "leadership" → show leadership decision form
 * - If phase = "compilation" → show "decisions submitted, awaiting compilation" message
 * - Shows submission status (submitted/not submitted)
 * - Shows countdown/timer until compilation (optional)
 *
 * Features:
 * - Loads game state (current_phase, current_quarter)
 * - Loads submission status for current phase
 * - Routes to correct form based on phase
 * - Shows submission status indicator
 * - Displays current quarter and phase
 *
 * Access Control:
 * - Only accessible by authenticated students
 * - Students can only access their company's decisions
 *
 * @route /student/decisions
 */

import React from "react";
import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { HiringDecisionForm } from "@/components/decisions/HiringDecisionForm";
import { LeadershipDecisionForm } from "@/components/decisions/LeadershipDecisionForm";
import { PhaseIndicator } from "@/components/decisions/PhaseIndicator";
import { ErrorPage } from "@/components/ErrorPage";

/**
 * Loading State Component
 *
 * Displays a loading spinner while fetching data.
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading decision form...</p>
      </div>
    </div>
  );
}

/**
 * Access Denied Component
 *
 * Displays when user doesn't have access to decisions.
 */
function AccessDenied({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
        <h1 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
          Access Denied
        </h1>
        <p className="text-red-700 dark:text-red-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * DecisionsPage Component
 *
 * Main page component that routes to the correct decision form
 * based on the current game phase.
 */
export function DecisionsPage() {
  const user = useCurrentUser();

  // Load current game context
  const game = useQuery(
    api.games.getGame,
    user?.gameId ? { gameId: user.gameId } : "skip"
  );

  // Load submission status for current phase
  const phaseStatus = useQuery(
    api.games.getPhaseStatus,
    user?.gameId && user?.companyId && game
      ? { gameId: user.gameId, companyId: user.companyId }
      : "skip"
  );

  // Loading state
  if (!user || !game) {
    return <LoadingState />;
  }

  // Access control: Students only
  if (user.role !== "student") {
    return <AccessDenied message="This page is only accessible to students." />;
  }

  // Access control: Must have company assignment
  if (!user.companyId) {
    return (
      <AccessDenied message="You must be assigned to a company before making decisions." />
    );
  }

  const { currentQuarter, currentPhase, status } = game;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Phase Indicator */}
        <PhaseIndicator
          quarter={currentQuarter}
          phase={currentPhase}
          gameStatus={status}
          submissionStatus={phaseStatus}
        />

        {/* Phase-based Routing */}
        {currentPhase === "hiring" && (
          <div className="mt-6">
            <HiringDecisionForm
              companyId={user.companyId}
              quarter={currentQuarter}
            />
          </div>
        )}

        {currentPhase === "leadership" && (
          <div className="mt-6">
            <LeadershipDecisionForm
              companyId={user.companyId}
              quarter={currentQuarter}
              user={user}
            />
          </div>
        )}

        {/* Compilation Phase Message */}
        {currentPhase !== "hiring" && currentPhase !== "leadership" && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-1">
                  Compilation in Progress
                </h3>
                <p className="text-blue-700 dark:text-blue-400">
                  Your decisions have been submitted and are currently being compiled.
                  Results will be available soon. Please check back later.
                </p>
                {phaseStatus?.isSubmitted && phaseStatus.submittedAt && (
                  <p className="text-sm text-blue-600 dark:text-blue-500 mt-2">
                    Submitted on {new Date(phaseStatus.submittedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Route definition using TanStack Router file-based routing
 *
 * Route: /student/decisions
 * Access: Students only
 * Component: DecisionsPage
 */
export const Route = createFileRoute("/student/decisions/")({
  component: DecisionsPage,
  errorComponent: ({ error }) => <ErrorPage error={error} />,

  // Before load: Check authentication and redirect if needed
  beforeLoad: async ({ location, context }) => {
    // Client-side auth check will happen in component
    // This is a placeholder for server-side auth if needed in future
    return {};
  },

  // Loader: Preload data if needed
  loader: async ({ context }) => {
    // Data is loaded via React Query in component
    return {};
  },
});
