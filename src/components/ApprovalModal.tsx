/**
 * Approval Modal Component
 *
 * Modal dialog for approving access requests with game/company assignment.
 * Shows different fields based on user role (teacher vs student).
 */

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

interface ApprovalModalProps {
  requestId: Id<"accessRequests">;
  onClose: () => void;
  onSubmit: (
    gameId: Id<"games"> | undefined,
    companyId: Id<"companies"> | undefined
  ) => void;
}

export function ApprovalModal({
  requestId,
  onClose,
  onSubmit,
}: ApprovalModalProps) {
  const [gameId, setGameId] = useState<Id<"games"> | "">("");
  const [companyId, setCompanyId] = useState<Id<"companies"> | "">("");

  const games = useQuery(api.accessRequests.listGames);
  const companies = useQuery(
    api.accessRequests.listCompanies,
    gameId ? { gameId: gameId as any } : "skip"
  );

  // Get request details to show user info
  const request = useQuery(
    // Since we don't have a getRequest query, we'll skip this for now
    // and just show the role-based fields
    api.accessRequests.listPending,
    {}
  );
  const currentRequest = request?.find((r) => r._id === requestId);

  const role = currentRequest?.role; // "teacher" | "student"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Teachers need gameId, students need both gameId and companyId
    if (!gameId) {
      alert("Please select a game");
      return;
    }

    if (role === "student" && !companyId) {
      alert("Please select a company for this student");
      return;
    }

    onSubmit(
      gameId as Id<"games">,
      companyId ? (companyId as Id<"companies">) : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 sm:mx-0 sm:h-10 sm:w-10">
                  <svg
                    className="h-6 w-6 text-green-600 dark:text-green-400"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                    Approve Access Request
                  </h3>
                  {currentRequest && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Approving access for{" "}
                        <strong>{currentRequest.name}</strong> (
                        {currentRequest.email})
                      </p>
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {role === "teacher" ? "Teacher" : "Student"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {/* Game Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assign to Game
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={gameId}
                    onChange={(e) => {
                      setGameId(e.target.value as Id<"games">);
                      setCompanyId(""); // Reset company when game changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select a game...</option>
                    {games?.map((game) => (
                      <option key={game._id} value={game._id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {role === "teacher"
                      ? "The game this teacher will manage"
                      : "The game this student will participate in"}
                  </p>
                </div>

                {/* Company Selection (for students only) */}
                {role === "student" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign to Company
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={companyId}
                      onChange={(e) =>
                        setCompanyId(e.target.value as Id<"companies">)
                      }
                      disabled={!gameId}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">
                        {!gameId
                          ? "Select a game first"
                          : "Select a company..."}
                      </option>
                      {companies?.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name} ({company.industry})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      The company this student will be assigned to
                    </p>
                  </div>
                )}

                {/* Info box for teachers */}
                {role === "teacher" && gameId && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <div className="flex">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          Teachers have access to all companies in their game.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                Approve Request
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
