/**
 * Student Dashboard Route - /student/dashboard
 *
 * Main dashboard for students providing:
 * - Current phase indicator (quarter X, hiring/leadership)
 * - Decision status (submitted/not submitted)
 * - Upcoming deadlines with countdown
 * - Quick links (decisions, rankings, reports)
 * - Company presence (online teammates)
 *
 * Features:
 * - Real-time presence indicators
 * - Decision deadline tracking
 * - Quick navigation to key features
 * - Company stats overview
 *
 * Access Control:
 * - Only accessible by authenticated students
 * - Students see only their company's data
 *
 * @route /student/dashboard
 */

import React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentUser, useQueryWithRLS } from "@/hooks/useCurrentUser";
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
        <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
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
 * Quick Link Card Component
 */
interface QuickLinkCardProps {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

function QuickLinkCard({ to, title, description, icon, badge }: QuickLinkCardProps) {
  return (
    <Link
      to={to}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}

/**
 * Deadline Card Component
 */
interface DeadlineCardProps {
  type: "hiring" | "leadership";
  quarter: number;
  status: "submitted" | "pending";
  submittedAt?: number;
}

function DeadlineCard({ type, quarter, status, submittedAt }: DeadlineCardProps) {
  const isHiring = type === "hiring";
  const isSubmitted = status === "submitted";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
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
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 ml-13">
          Submitted {new Date(submittedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

/**
 * Stats Card Component
 */
interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange";
}

function StatsCard({ label, value, icon, color = "blue" }: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * StudentDashboardPage Component
 */
export function StudentDashboardPage() {
  const user = useCurrentUser();

  // Load dashboard data (RLS-protected)
  const dashboardData = useQueryWithRLS(
    api.student.dashboard.getDashboardData,
    user?.companyId ? { companyId: user.companyId } : "skip"
  );

  // Load upcoming deadlines
  const deadlines = useQuery(
    api.student.dashboard.getUpcomingDeadlines,
    user?.companyId ? { companyId: user.companyId } : "skip"
  );

  // Load notification count
  const notificationCount = useQuery(
    api.student.dashboard.getNotificationCount,
    user?.userId ? { userId: user.userId } : "skip"
  );

  // Load phase status (RLS-protected)
  const phaseStatus = useQueryWithRLS(
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
        message="Failed to load dashboard data. Please try again."
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
      <AccessDenied message="You must be assigned to a company before viewing the dashboard." />
    );
  }

  const { company, game, stats } = dashboardData;

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
        {/* Phase Indicator */}
        <div className="mb-8">
          <PhaseIndicator
            quarter={game.currentQuarter}
            phase={game.currentPhase}
            gameStatus={game.status}
            submissionStatus={phaseStatus}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            label="Active Sales Reps"
            value={stats.activeRepsCount}
            color="blue"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            }
          />
          <StatsCard
            label="Current Quarter"
            value={`Q${stats.currentQuarter}`}
            color="green"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          />
          <StatsCard
            label="Current Phase"
            value={stats.currentPhase === "hiring" ? "Hiring" : "Leadership"}
            color="purple"
            icon={
              stats.currentPhase === "hiring" ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
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
              )
            }
          />
        </div>

        {/* Upcoming Deadlines */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Deadlines
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
                <DeadlineCard
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
              <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming deadlines</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLinkCard
              to="/student/decisions"
              title="Decisions"
              description="Submit hiring and leadership decisions"
              badge={game.currentPhase === "hiring" ? "Hiring" : "Leadership"}
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
            <QuickLinkCard
              to="/student/rankings/sort"
              title="Resume Rankings"
              description="Rank and sort sales rep candidates"
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
            <QuickLinkCard
              to="/student/territories"
              title="Territory Assignments"
              description="Assign territories to sales reps"
              badge="Leadership"
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
          </div>
        </div>

        {/* Notifications (placeholder for future) */}
        {notificationCount !== undefined && notificationCount > 0 && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                You have {notificationCount} unread notification{notificationCount !== 1 ? "s" : ""}
              </p>
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
 * Route: /student/dashboard
 * Access: Students only
 * Component: StudentDashboardPage
 */
export const Route = createFileRoute("/student/dashboard")({
  component: StudentDashboardPage,
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
