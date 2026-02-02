/**
 * Teacher Dashboard Page
 *
 * Provides teachers with an overview of their game including:
 * - Game state (quarter, phase, status)
 * - Company submission status
 * - Upcoming deadlines
 * - Recent activity feed
 * - Quick actions (compile, reports)
 *
 * Access: Teachers only (redirects if not authenticated or wrong role)
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/teacher/dashboard")({
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  const currentUser = useQuery(api.users.getCurrent);

  // Redirect if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  // Redirect if not teacher
  if (currentUser.role !== "teacher") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Teacher dashboard is only accessible to teachers.
          </p>
        </div>
      </div>
    );
  }

  // Get teacher's game
  const gameId = currentUser.gameId;
  if (!gameId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
            No Game Assigned
          </h2>
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            You have not been assigned to a game yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <TeacherDashboard gameId={gameId} />;
}

function TeacherDashboard({ gameId }: { gameId: Id<"games"> }) {
  // Fetch dashboard data
  const dashboardData = useQuery(api.teacher.dashboard.getDashboardData, { gameId });
  const companyStatuses = useQuery(api.teacher.dashboard.getCompanyStatuses, { gameId });
  const deadlines = useQuery(api.teacher.dashboard.getUpcomingDeadlines, { gameId });
  const recentActivity = useQuery(api.teacher.dashboard.getRecentActivity, { gameId, limit: 10 });

  if (!dashboardData || !companyStatuses || !deadlines) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { game, companyCount, submittedCount, pendingCount, currentPhase } = dashboardData;
  const submissionProgress = companyCount > 0 ? (submittedCount / companyCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teacher Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {game.name} - Manage your game and track student progress
          </p>
        </div>

        {/* Game Overview Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Game Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Quarter */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Quarter
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                Q{game.currentQuarter}
              </p>
            </div>

            {/* Phase */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Phase
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white capitalize">
                {game.currentPhase}
              </p>
            </div>

            {/* Status */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status
              </p>
              <p className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  game.status === "active"
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                    : game.status === "setup"
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                    : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                }`}>
                  {game.status}
                </span>
              </p>
            </div>

            {/* Progress */}
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Submissions
              </p>
              <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                {submittedCount}/{companyCount}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Submission Progress
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Math.round(submissionProgress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${submissionProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>

          <div className="flex flex-wrap gap-4">
            <Link
              to="/admin/compilation"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Compile Now
            </Link>

            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Reports
            </button>

            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Game Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Status Grid (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Company Status
              </h2>

              {companyStatuses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="mt-2 text-sm">No companies found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companyStatuses.map((company) => (
                    <div
                      key={company.companyId}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {company.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {company.industry}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Hiring Status */}
                        {currentPhase === "hiring" && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.hiringSubmitted
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                          }`}>
                            {company.hiringSubmitted ? "Submitted" : "Pending"}
                          </span>
                        )}

                        {/* Leadership Status */}
                        {currentPhase === "leadership" && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.leadershipSubmitted
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                          }`}>
                            {company.leadershipSubmitted ? "Submitted" : "Pending"}
                          </span>
                        )}

                        {/* Last Activity */}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(company.lastActivity, { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Deadlines & Activity (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Schedule
              </h2>

              <div className="space-y-3">
                {deadlines.estimatedDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-3 rounded-md ${
                      deadline.isCurrent
                        ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {deadline.label}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Q{deadline.quarter} - {deadline.phase}
                      </p>
                    </div>

                    {deadline.isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        Current
                      </span>
                    )}
                  </div>
                ))}

                {deadlines.status === "completed" && (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    Game completed
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Recent Activity
              </h2>

              {!recentActivity || recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-xs">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === "hiring_submit" ? (
                          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.companyName}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
