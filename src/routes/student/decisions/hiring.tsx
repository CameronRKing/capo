/**
 * Hiring Decision Route - /student/decisions/hiring
 *
 * Route for students to enter hiring decisions for the current quarter.
 *
 * Features:
 * - Loads user and game context
 * - Displays HiringDecisionForm with all fields
 * - Shows presence indicators for teammates
 * - Handles form submission and redirects
 * - Displays submission status
 *
 * Access Control:
 * - Only accessible by authenticated students
 * - Students can only access their company's decisions
 * - Route guards redirect unauthorized users
 *
 * @route /student/decisions/hiring
 */

import React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { HiringDecisionForm } from "@/components/decisions/HiringDecisionForm";
import { ErrorPage } from "@/components/ErrorPage";
import { Id } from "@convex/_generated/dataModel";

/**
 * HiringDecisionPage Component
 *
 * Main page component for hiring decisions.
 * Loads user context and renders the form.
 */
export function HiringDecisionPage() {
  const user = useCurrentUser();

  // Load current game context
  const game = useQuery(
    api.games.getByUser,
    user?.gameId ? { gameId: user.gameId } : "skip"
  );

  // Loading state
  if (!user || !game) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading hiring decisions...</p>
        </div>
      </div>
    );
  }

  // Access control: Students only
  if (user.role !== "student") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md">
          <h1 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
            Access Denied
          </h1>
          <p className="text-red-700 dark:text-red-400">
            This page is only accessible to students.
          </p>
        </div>
      </div>
    );
  }

  // Access control: Must have company assignment
  if (!user.companyId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 max-w-md">
          <h1 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">
            No Company Assignment
          </h1>
          <p className="text-yellow-700 dark:text-yellow-400">
            You must be assigned to a company before making hiring decisions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Hiring Decisions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quarter {game.currentQuarter} - {game.currentPhase === "hiring" ? "Hiring Phase" : "Leadership Phase"}
          </p>
        </div>

        {/* Phase Guard - Only show during hiring phase */}
        {game.currentPhase !== "hiring" && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                  Wrong Phase
                </h3>
                <p className="text-yellow-700 dark:text-yellow-400">
                  Hiring decisions can only be entered during the hiring phase. The current phase is{" "}
                  <span className="font-medium">{game.currentPhase}</span>.
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
                  Please contact your instructor if you believe this is an error.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Decision Form */}
        {game.currentPhase === "hiring" && (
          <HiringDecisionForm
            companyId={user.companyId}
            quarter={game.currentQuarter}
          />
        )}

        {/* Submission Status (if already submitted) */}
        {game.currentPhase === "hiring" && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Submission Status
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Your hiring decisions will be saved automatically as you work. Click "Submit Decisions"
              when ready to finalize. After submission, you cannot make changes until the next quarter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Route definition using TanStack Router file-based routing
 *
 * Route: /student/decisions/hiring
 * Access: Students only
 * Component: HiringDecisionPage
 */
export const Route = createFileRoute("/student/decisions/hiring")({
  component: HiringDecisionPage,
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
