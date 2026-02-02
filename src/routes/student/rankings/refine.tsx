/**
 * Refinement Page - Phase 2 Resume Ranking Refinement
 *
 * Students see all three groups (A/B/C) simultaneously and can
 * drag profiles within and between groups for fine-tuning.
 *
 * Route: /student/rankings/refine
 *
 * Features:
 * - Three-column drag-drop interface
 * - Real-time teammate rankings display
 * - Auto-save on drag-drop
 * - Collaborative presence indicators
 * - Resume preview on hover
 *
 * Access Control:
 * - Only students can access this route
 * - Students can only view their own company's rankings
 *
 * @example
 * ```tsx
 * // Navigate to refinement page
 * <Link to="/student/rankings/refine">Refine Rankings</Link>
 * ```
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { RefinementBoard, RankingItem } from "../../../components/domain/rankings";
import { CompanyPresenceHeader } from "../../../components/collaboration/CompanyPresenceHeader";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

/**
 * Loader - Auth check and data preloading
 */
export const Route = createFileRoute("/student/rankings/refine")({
  beforeLoad: async ({ context }) => {
    // Check if user is authenticated
    // TODO: Add proper auth check when auth is implemented
    // For now, we'll skip the auth check
    return {};
  },

  component: RefinementPage,
});

/**
 * Helper: Convert Convex rankings to RankingItem format
 */
function convertToRankingItems(
  rankings: Array<{
    repId: string;
    name: string;
    education: string;
    experience: string;
    intelligence: number;
    myers_briggs: string;
    group: "A" | "B" | "C";
    rank: number;
  }>
): RankingItem[] {
  return rankings.map((r) => ({
    repId: r.repId,
    name: r.name,
    education: r.education,
    experience: r.experience,
    intelligence: r.intelligence,
    myers_briggs: r.myers_briggs,
    group: r.group,
    rank: r.rank,
  }));
}

/**
 * Refinement Page Component
 */
function RefinementPage() {
  // Get current user
  const user = useCurrentUser();

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view this page.</p>
          <a
            href="/login"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  // Check if user has a company
  if (!user.companyId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">You are not assigned to a company yet.</p>
        </div>
      </div>
    );
  }

  const userId = user._id;
  const companyId = user.companyId;

  // Fetch user's rankings
  const myRawRankings = useQuery(api.rankings.getMyRankings, {
    companyId,
  });

  // Fetch teammate rankings
  const teammateRankings = useQuery(api.rankings.getTeammateRankings, {
    companyId,
  });

  // Save rankings mutation
  const saveRankings = useMutation(api.rankings.saveRankingsBatch);

  // Fetch all resumes for enrichment
  const allResumes = useQuery(api.resumes.getAll);

  // Combine rankings with resume data
  const myRankings = myRawRankings && allResumes ? {
    A: convertToRankingItems(
      myRawRankings.A.map((ranking) => {
        const resume = allResumes.find((r) => r.repId === ranking.repId);
        return {
          repId: ranking.repId,
          name: resume?.name ?? "Unknown",
          education: resume?.education ?? "",
          experience: resume?.experience ?? "",
          intelligence: resume?.intelligence ?? 0,
          myers_briggs: resume?.myers_briggs ?? "",
          group: ranking.group,
          rank: ranking.rank,
        };
      })
    ),
    B: convertToRankingItems(
      myRawRankings.B.map((ranking) => {
        const resume = allResumes.find((r) => r.repId === ranking.repId);
        return {
          repId: ranking.repId,
          name: resume?.name ?? "Unknown",
          education: resume?.education ?? "",
          experience: resume?.experience ?? "",
          intelligence: resume?.intelligence ?? 0,
          myers_briggs: resume?.myers_briggs ?? "",
          group: ranking.group,
          rank: ranking.rank,
        };
      })
    ),
    C: convertToRankingItems(
      myRawRankings.C.map((ranking) => {
        const resume = allResumes.find((r) => r.repId === ranking.repId);
        return {
          repId: ranking.repId,
          name: resume?.name ?? "Unknown",
          education: resume?.education ?? "",
          experience: resume?.experience ?? "",
          intelligence: resume?.intelligence ?? 0,
          myers_briggs: resume?.myers_briggs ?? "",
          group: ranking.group,
          rank: ranking.rank,
        };
      })
    ),
  } : undefined;

  // Loading state
  if (!myRankings || !allResumes) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading rankings...</p>
        </div>
      </div>
    );
  }

  // Empty state - no rankings yet
  const totalRankings = myRankings.A.length + myRankings.B.length + myRankings.C.length;
  if (totalRankings === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              No Rankings Yet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't ranked any resumes yet. Start with the rough sorting phase
              to assign resumes to groups A, B, or C.
            </p>
            <a
              href="/student/rankings/sort"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Rough Sorting
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with presence */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Refine Rankings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Drag profiles within and between groups to fine-tune your rankings
              </p>
            </div>
            <CompanyPresenceHeader
              companyId={companyId}
              showOnlineCount={true}
              showAvatars={true}
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Total Ranked:
              </span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">
                {totalRankings}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                A: {myRankings.A.length}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                B: {myRankings.B.length}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                C: {myRankings.C.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Refinement Board */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="h-[calc(100vh-240px)]">
          <RefinementBoard
            myRankings={myRankings}
            teammateRankings={teammateRankings}
            onSave={saveRankings}
            companyId={companyId}
            userId={userId}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">Tip:</span> Drag profiles to reorder within a group or move them to a different group. Rankings save automatically.
      </div>
    </div>
  );
}
