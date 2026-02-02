/**
 * Teacher Student Monitoring Page
 *
 * Provides teachers with detailed student progress tracking including:
 * - Student list with company assignments
 * - Decision submission status per student
 * - Last activity timestamps
 * - Filtering by company and submission status
 * - Real-time presence indicators
 *
 * Access: Teachers only (redirects if not authenticated or wrong role)
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/teacher/students")({
  component: TeacherStudentsPage,
});

function TeacherStudentsPage() {
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
            Student monitoring is only accessible to teachers.
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

  return <TeacherStudents gameId={gameId} />;
}

function TeacherStudents({ gameId }: { gameId: Id<"games"> }) {
  // Fetch student data
  const studentProgress = useQuery(api.teacher.monitoring.getStudentProgress, { gameId });
  const presenceByCompany = useQuery(api.teacher.monitoring.getPresenceByCompany, { gameId });

  // Filter state
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Extract unique companies
  const companies = useMemo(() => {
    if (!studentProgress) return [];
    const uniqueCompanies = new Map<string, string>(); // companyId -> name
    studentProgress.forEach((student) => {
      if (student.companyId && student.companyName) {
        uniqueCompanies.set(student.companyId, student.companyName);
      }
    });
    return Array.from(uniqueCompanies.entries()).map(([id, name]) => ({ id, name }));
  }, [studentProgress]);

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!studentProgress) return [];

    return studentProgress.filter((student) => {
      // Filter by company
      if (filterCompany !== "all" && student.companyId !== filterCompany) {
        return false;
      }

      // Filter by status
      if (filterStatus === "submitted" && !student.hasSubmittedCurrentPhase) {
        return false;
      }
      if (filterStatus === "pending" && student.hasSubmittedCurrentPhase) {
        return false;
      }

      return true;
    });
  }, [studentProgress, filterCompany, filterStatus]);

  // Create a map of active users by company
  const activeUsersByCompany = useMemo(() => {
    if (!presenceByCompany) return new Map();
    const map = new Map<string, Set<string>>();
    presenceByCompany.forEach((company) => {
      const activeUserIds = new Set(
        company.activeUsers.map((u) => u.userId)
      );
      map.set(company.companyId, activeUserIds);
    });
    return map;
  }, [presenceByCompany]);

  if (!studentProgress || !presenceByCompany) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const submittedCount = studentProgress.filter((s) => s.hasSubmittedCurrentPhase).length;
  const pendingCount = studentProgress.length - submittedCount;
  const activeCount = presenceByCompany.reduce((sum, c) => sum + c.activeCount, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Student Monitoring
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track student progress, activity, and engagement
              </p>
            </div>
            <Link
              to="/teacher/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {/* Total Students */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Students
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {studentProgress.length}
                </p>
              </div>
            </div>
          </div>

          {/* Submitted */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Submitted
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {submittedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Pending
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {pendingCount}
                </p>
              </div>
            </div>
          </div>

          {/* Active Now */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Now
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Filters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Filter */}
            <div>
              <label htmlFor="company-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company
              </label>
              <select
                id="company-filter"
                value={filterCompany}
                onChange={(e) => setFilterCompany(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Submission Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredStudents.length} of {studentProgress.length} students
            </p>
            {(filterCompany !== "all" || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setFilterCompany("all");
                  setFilterStatus("all");
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Student List */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Students
            </h2>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-2 text-sm">No students found</p>
              {(filterCompany !== "all" || filterStatus !== "all") && (
                <p className="text-xs mt-1">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Company
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => {
                    const activeUsers = activeUsersByCompany.get(student.companyId ?? "");
                    const isActive = student.companyId && activeUsers?.has(student.userId);

                    return (
                      <tr
                        key={student.userId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {/* Student Name & Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                              <span className="text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {student.companyName || (
                              <span className="text-gray-400 dark:text-gray-500 italic">Not assigned</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.hasSubmittedCurrentPhase ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Last Activity */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(student.lastActivity, { addSuffix: true })}
                        </td>

                        {/* Active Indicator */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isActive ? (
                            <div className="flex items-center">
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></span>
                              <span className="ml-2 text-sm text-green-600 dark:text-green-400">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                              <span className="ml-2 text-sm text-gray-400 dark:text-gray-500">Offline</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
