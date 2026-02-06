/**
 * Student Navigation Hub - /student/
 *
 * Main navigation hub and landing page for students providing:
 * - Current phase indicator (quarter X, hiring/leadership)
 * - Quick action cards for key student actions
 * - Progress indicators for decision submission
 * - Phase-specific call-to-actions
 *
 * Features:
 * - Central navigation point for all student activities
 * - Phase-aware action cards (hiring vs leadership)
 * - Progress tracking for decisions
 * - Quick links to rankings, territories, and reports
 * - Dark mode support
 *
 * Access Control:
 * - Only accessible by authenticated students
 * - Students see only their company's data
 *
 * @route /student/
 */

import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PhaseIndicator } from "@/components/decisions/PhaseIndicator";
import { CompanyPresenceHeader } from "@/components/collaboration/CompanyPresenceHeader";
import { ErrorState } from "@/components/ui/ErrorState";

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading navigation hub...</p>
      </div>
    </div>
  );
}

/**
 * Access Denied Component
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
 * Action Card Component
 *
 * Displays a quick action card with icon, title, description, and optional badge.
 * Links to the specified route on click.
 */
interface ActionCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: "blue" | "green" | "purple" | "yellow" | "red";
  disabled?: boolean;
}

function ActionCard({
  to,
  title,
  description,
  icon,
  badge,
  badgeColor = "blue",
  disabled = false,
}: ActionCardProps) {
  const badgeColors = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300",
    yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300",
    red: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300",
  };

  const card = (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 transition-all ${
        disabled
          ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
          : "border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
              disabled
                ? "bg-gray-100 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600"
                : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {badge && (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );

  if (disabled) {
    return card;
  }

  return <Link to={to}>{card}</Link>;
}

/**
 * Progress Card Component
 *
 * Shows progress indicators for decision submission status.
 */
interface ProgressCardProps {
  type: "hiring" | "leadership";
  quarter: number;
  status: "submitted" | "pending";
  submittedAt?: number;
}

function ProgressCard({ type, quarter, status, submittedAt }: ProgressCardProps) {
  const isHiring = type === "hiring";
  const isSubmitted = status === "submitted";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isHiring
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            }`}
          >
            {isHiring ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            )}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">
              {isHiring ? "Hiring" : "Leadership"} Decisions
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quarter {quarter}</p>
          </div>
        </div>
        <div>
          {isSubmitted ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Pending
            </span>
          )}
        </div>
      </div>
      {isSubmitted && submittedAt && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Submitted {new Date(submittedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

/**
 * PhaseCTA Component
 *
 * Displays phase-specific call-to-action banner.
 */
interface PhaseCTAProps {
  phase: "hiring" | "leadership";
  isSubmitted: boolean;
}

function PhaseCTA({ phase, isSubmitted }: PhaseCTAProps) {
  if (phase === "hiring") {
    if (isSubmitted) {
      return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                Hiring Decisions Submitted
              </h3>
              <p className="text-green-700 dark:text-green-400 mb-3">
                Your hiring decisions have been submitted. You can still view and rank resumes
                while waiting for the next phase.
              </p>
              <Link
                to="/student/rankings/sort"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                View Resume Rankings
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Submit Your Hiring Decisions
            </h3>
            <p className="text-blue-700 dark:text-blue-400 mb-3">
              Review ranked resumes and submit your hiring decisions for this quarter. Make sure
              to rank candidates before submitting.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/student/decisions"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Make Decisions
              </Link>
              <Link
                to="/student/rankings/sort"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
                Rank Resumes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Leadership phase
  if (isSubmitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
              Leadership Decisions Submitted
            </h3>
            <p className="text-green-700 dark:text-green-400 mb-3">
              Your leadership decisions have been submitted. You can view territory assignments
              while waiting for results.
            </p>
            <Link
              to="/student/territories"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              View Territories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-2">
            Assign Territories to Your Sales Team
          </h3>
          <p className="text-purple-700 dark:text-purple-400 mb-3">
            Assign geographic territories to your sales representatives based on their strengths
            and market potential.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/student/decisions"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Make Decisions
            </Link>
            <Link
              to="/student/territories"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              View Territories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * StudentNavigationHubPage Component
 *
 * Main navigation hub page for students.
 */
export function StudentNavigationHubPage() {
  const user = useCurrentUser();

  // Load dashboard data
  const dashboardData = useQuery(
    api.student.dashboard.getDashboardData,
    user?.companyId ? { companyId: user.companyId } : "skip"
  );

  // Load upcoming deadlines
  const deadlines = useQuery(
    api.student.dashboard.getUpcomingDeadlines,
    user?.companyId ? { companyId: user.companyId } : "skip"
  );

  // Load phase status
  const phaseStatus = useQuery(
    api.games.getPhaseStatus,
    user?.gameId && user?.companyId ? { gameId: user.gameId, companyId: user.companyId } : "skip"
  );

  // Loading state
  if (!user || !dashboardData) {
    return <LoadingState />;
  }

  // Error handling: Check for null dashboardData after loading
  if (user.companyId && dashboardData === null) {
    return (
      <ErrorState
        message="Failed to load navigation hub. Please try again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Access control: Students only
  if (user.role !== "student") {
    return <AccessDenied message="This page is only accessible to students." />;
  }

  // Access control: Must have company assignment
  if (!user.companyId) {
    return (
      <AccessDenied message="You must be assigned to a company before viewing the navigation hub." />
    );
  }

  const { company, game, stats } = dashboardData;
  const { currentQuarter, currentPhase } = game;

  // Determine current phase submission status
  const currentPhaseDeadline = deadlines?.find((d) => d.type === currentPhase && d.quarter === currentQuarter);
  const isCurrentPhaseSubmitted = currentPhaseDeadline?.status === "submitted";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Presence */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <CompanyPresenceHeader
            companyId={user.companyId}
            companyName={company?.name}
            avatarSize={36}
            maxAvatars={5}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to {company?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your sales team and make strategic decisions
          </p>
        </div>

        {/* Phase Indicator */}
        <div className="mb-8">
          <PhaseIndicator
            quarter={currentQuarter}
            phase={currentPhase}
            gameStatus={game.status}
            submissionStatus={phaseStatus}
          />
        </div>

        {/* Phase-Specific CTA */}
        {currentPhase === "hiring" || currentPhase === "leadership" ? (
          <PhaseCTA phase={currentPhase} isSubmitted={isCurrentPhaseSubmitted} />
        ) : null}

        {/* Progress Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Decision Progress
          </h2>
          {deadlines === null ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Unable to load deadlines. This feature may be temporarily unavailable.
              </p>
            </div>
          ) : deadlines && deadlines.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deadlines.map((deadline) => (
                <ProgressCard
                  key={`${deadline.type}-${deadline.quarter}`}
                  type={deadline.type}
                  quarter={deadline.quarter}
                  status={deadline.status}
                  submittedAt={deadline.submittedAt}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">No deadlines yet</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make Decisions - always available */}
            <ActionCard
              to="/student/decisions"
              title="Make Decisions"
              description={
                currentPhase === "hiring"
                  ? "Review and submit hiring decisions"
                  : "Review and submit leadership decisions"
              }
              badge={currentPhase === "hiring" ? "Hiring" : "Leadership"}
              badgeColor={currentPhase === "hiring" ? "green" : "purple"}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            />

            {/* View Rankings - available in hiring phase */}
            <ActionCard
              to="/student/rankings/sort"
              title="View Rankings"
              description="Rank and sort sales rep candidates"
              badge="Hiring Phase"
              badgeColor="green"
              disabled={currentPhase !== "hiring"}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                  />
                </svg>
              }
            />

            {/* View Territories - available in leadership phase */}
            <ActionCard
              to="/student/territories"
              title="View Territories"
              description="Assign territories to sales reps"
              badge="Leadership Phase"
              badgeColor="purple"
              disabled={currentPhase !== "leadership"}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              }
            />

            {/* View Reports - placeholder for future */}
            <ActionCard
              to="/student/dashboard"
              title="View Reports"
              description="View performance reports and analytics"
              badge="Coming Soon"
              badgeColor="yellow"
              disabled={true}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
            />
          </div>
        </div>

        {/* Additional Links */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            More Options
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            <Link
              to="/student/dashboard"
              className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  <span className="text-gray-700 dark:text-gray-300">View Full Dashboard</span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Route definition using TanStack Router file-based routing
 *
 * Route: /student/
 * Access: Students only
 * Component: StudentNavigationHubPage
 */
export const Route = createFileRoute("/student/")({
  component: StudentNavigationHubPage,
  errorComponent: ({ error }) => <ErrorPage error={error} />,

  // Before load: Check authentication
  beforeLoad: async ({ location, context }) => {
    // Client-side auth check will happen in component
    return {};
  },

  // Loader: Preload data if needed
  loader: async ({ context }) => {
    // Data is loaded via React Query in component
    return {};
  },
});
