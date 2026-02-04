/**
 * Admin Compilation Page
 *
 * Allows admins and teachers to trigger compilation processes for games.
 *
 * Features:
 * - View submission status per game/quarter
 * - Check which companies have submitted decisions
 * - Trigger hiring or leadership compilation
 * - Proceed with defaults option for incomplete submissions
 * - Real-time progress/error display
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

export const Route = createFileRoute("/admin/compilation")({
  component: AdminCompilationPage,
});

type Phase = "hiring" | "leadership";

export function AdminCompilationPage() {
  const currentUser = useQuery(api.myFunctions.domain.users.getCurrent);
  const games = useQuery(api.myFunctions.admin.accessRequests.listGames);

  // Selected game/quarter/phase
  const [selectedGameId, setSelectedGameId] = useState<Id<"games"> | "">("");
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [selectedPhase, setSelectedPhase] = useState<Phase>("hiring");

  // Compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationResult, setCompilationResult] = useState<any>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);

  // Get companies for selected game
  const companies = useQuery(
    api.myFunctions.internal.listGameCompanies,
    selectedGameId ? { gameId: selectedGameId as Id<"games"> } : "skip"
  );

  // Check submission status
  const submissionStatus = useQuery(
    api.myFunctions.admin.compilation.checkSubmissionStatus,
    selectedGameId && selectedQuarter && selectedPhase
      ? {
          gameId: selectedGameId as Id<"games">,
          quarter: selectedQuarter,
          phase: selectedPhase,
        }
      : "skip"
  );

  // Get current compilation status
  const compilationStatus = useQuery(
    api.myFunctions.admin.compilation.getCompilationStatus,
    selectedGameId && selectedQuarter && selectedPhase
      ? {
          gameId: selectedGameId as Id<"games">,
          quarter: selectedQuarter,
          phase: selectedPhase,
        }
      : "skip"
  );

  // Compile actions
  const compileHiring = useAction(api.myFunctions.admin.compilation.compileHiringDecisions);
  const compileLeadership = useAction(
    api.myFunctions.admin.compilation.compileLeadershipDecisions
  );

  // Redirect if not authenticated or not admin/teacher
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (currentUser.role !== "admin" && currentUser.role !== "teacher") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            Only admins and teachers can access this page.
          </p>
        </div>
      </div>
    );
  }

  // Filter games based on user role
  const accessibleGames =
    currentUser.role === "admin"
      ? games
      : games?.filter((game) => game._id === currentUser.gameId);

  const handleCompile = async (proceedWithDefaults: boolean) => {
    if (!selectedGameId) return;

    setIsCompiling(true);
    setCompilationResult(null);
    setCompilationError(null);

    try {
      const result =
        selectedPhase === "hiring"
          ? await compileHiring({
              gameId: selectedGameId as Id<"games">,
              quarter: selectedQuarter,
              proceedWithDefaults,
            })
          : await compileLeadership({
              gameId: selectedGameId as Id<"games">,
              quarter: selectedQuarter,
              proceedWithDefaults,
            });

      setCompilationResult(result);

      // If compilation was blocked by incomplete submissions, show warning
      if (!result.success && result.canProceed === false) {
        setCompilationError(result.message);
      }
    } catch (error: any) {
      setCompilationError(error.message);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Compilation Control
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Trigger compilation processes and review submission status
            </p>
          </div>
          <Link
            to="/admin/results"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            View History
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Game Selection */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Select Game
              </h2>

              <div className="space-y-4">
                {/* Game */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Game
                  </label>
                  <select
                    value={selectedGameId}
                    onChange={(e) => {
                      setSelectedGameId(e.target.value as Id<"games"> | "");
                      setCompilationResult(null);
                      setCompilationError(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select game...</option>
                    {accessibleGames?.map((game) => (
                      <option key={game._id} value={game._id}>
                        {game.name} (Q{game.currentQuarter})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quarter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quarter
                  </label>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => {
                      setSelectedQuarter(Number(e.target.value));
                      setCompilationResult(null);
                      setCompilationError(null);
                    }}
                    disabled={!selectedGameId}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((q) => (
                      <option key={q} value={q}>
                        Quarter {q}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phase
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="hiring"
                        checked={selectedPhase === "hiring"}
                        onChange={(e) =>
                          setSelectedPhase(e.target.value as Phase)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Hiring
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="leadership"
                        checked={selectedPhase === "leadership"}
                        onChange={(e) =>
                          setSelectedPhase(e.target.value as Phase)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Leadership
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Compile Actions */}
            {selectedGameId && (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Compile {selectedPhase === "hiring" ? "Hiring" : "Leadership"}{" "}
                  Decisions
                </h2>

                {/* Current Compilation Status */}
                {compilationStatus && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Last Compilation
                      </span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                        {compilationStatus.status}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p>
                        Status:{" "}
                        {compilationStatus.status === "success"
                          ? "Completed"
                          : compilationStatus.status === "failed"
                          ? "Failed"
                          : "In Progress"}
                      </p>
                      <p>
                        Companies: {compilationStatus.companiesProcessed}
                      </p>
                      {compilationStatus.errorMessage && (
                        <p className="text-red-600 dark:text-red-400">
                          Error: {compilationStatus.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {submissionStatus && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Submissions:
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {submissionStatus.submittedCompanies} /{" "}
                        {submissionStatus.totalCompanies}
                      </span>
                    </div>
                    {submissionStatus.missingCompanies > 0 && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        {submissionStatus.missingCompanies} companies not
                        submitted
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={() => handleCompile(false)}
                    disabled={isCompiling || !submissionStatus?.missingCompanies === 0}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCompiling ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Compiling...
                      </>
                    ) : (
                      "Compile (All Submitted)"
                    )}
                  </button>

                  {submissionStatus?.missingCompanies > 0 && (
                    <button
                      onClick={() => handleCompile(true)}
                      disabled={isCompiling}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCompiling ? (
                        "Compiling..."
                      ) : (
                        <>
                          Proceed with Defaults
                          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                            ({submissionStatus.missingCompanies} missing)
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {compilationError && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {compilationError}
                    </p>
                  </div>
                )}

                {compilationResult?.success && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Compilation Complete!
                    </p>
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      {compilationResult.companiesProcessed} companies processed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Status */}
          <div className="lg:col-span-2">
            {selectedGameId ? (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Submission Status
                </h2>

                {!submissionStatus ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : companies && companies.length > 0 ? (
                  <div className="space-y-3">
                    {companies.map((company) => {
                      const isSubmitted = !submissionStatus.missing?.find(
                        (m: any) => m.companyId === company._id
                      );

                      return (
                        <div
                          key={company._id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {company.name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {company.industry}
                            </p>
                          </div>
                          <div className="flex items-center">
                            {isSubmitted ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                <svg
                                  className="mr-1 h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Submitted
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                <svg
                                  className="mr-1 h-3 w-3"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <p>No companies found for this game</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No game selected
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select a game to view submission status and trigger compilation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
