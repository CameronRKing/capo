/**
 * useRankings Hook - Manage resume ranking state
 *
 * Hook for managing the rough sorting and refinement of resume rankings.
 * Provides utilities for tracking progress, assigning profiles to groups,
 * and navigating through unranked resumes.
 *
 * Features:
 * - Track user's rankings (grouped by A/B/C)
 * - Get unranked resumes for rough sorting
 * - Assign profile to group
 * - Move profiles between groups
 * - Progress tracking (X of 70 ranked)
 *
 * @example
 * ```tsx
 * function SortingPage() {
 *   const user = useCurrentUser();
 *   const {
 *     myRankings,
 *     unrankedResumes,
 *     currentResume,
 *     progress,
 *     assignToGroup,
 *     moveToGroup,
 *     skipResume
 *   } = useRankings(user.companyId);
 *
 *   return (
 *     <div>
 *       <ProgressBar {...progress} />
 *       <ResumeCard resume={currentResume} />
 *       <button onClick={() => assignToGroup('A')}>Group A</button>
 *     </div>
 *   );
 * }
 */

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";

/**
 * Progress tracking data
 */
export interface RankingProgress {
  /** Total resumes available */
  total: number;
  /** Number of resumes ranked */
  ranked: number;
  /** Number of resumes not yet ranked */
  unranked: number;
  /** Completion percentage */
  percentComplete: number;
}

/**
 * Return type for useRankings hook
 */
export interface UseRankingsReturn {
  /** User's current rankings grouped by A/B/C */
  myRankings: {
    A: Array<{ repId: string; rank: number }>;
    B: Array<{ repId: string; rank: number }>;
    C: Array<{ repId: string; rank: number }>;
  } | null;
  /** Unranked resumes for rough sorting */
  unrankedResumes: Array<{ repId: string; [key: string]: any }> | null;
  /** Current resume being viewed (first unranked) */
  currentResume: { repId: string; [key: string]: any } | null;
  /** Current index in unranked list */
  currentIndex: number;
  /** Progress tracking */
  progress: RankingProgress | null;
  /** Assign current resume to a group */
  assignToGroup: (group: "A" | "B" | "C") => Promise<void>;
  /** Move to next resume */
  nextResume: () => void;
  /** Move to previous resume */
  previousResume: () => void;
  /** Skip current resume (don't assign) */
  skipResume: () => void;
  /** Move specific resume to different group */
  moveToGroup: (repId: string, group: "A" | "B" | "C") => Promise<void>;
  /** Remove resume from rankings */
  removeFromRankings: (repId: string) => Promise<void>;
  /** Loading state */
  isLoading: boolean;
}

/**
 * Hook for managing resume rankings
 *
 * @param companyId - The company ID
 * @returns Ranking state and operations
 */
export function useRankings(
  companyId: Id<"companies"> | string | null | undefined
): UseRankingsReturn {
  // Queries
  const myRankings = useQuery(
    api.myFunctions.domain.rankings.getMyRankings,
    companyId ? { companyId: companyId as Id<"companies"> } : "skip"
  );
  const allResumes = useQuery(api.myFunctions.domain.resumes.getAll);

  // Mutations
  const saveRanking = useMutation(api.myFunctions.domain.rankings.saveRanking);
  const deleteRanking = useMutation(api.myFunctions.domain.rankings.deleteRanking);

  // Local state for navigation
  const [currentIndex, setCurrentIndex] = useState(0);

  // Calculate unranked resumes
  const unrankedResumes = allResumes && myRankings ? (
    allResumes.filter((resume) => {
      const isRanked =
        myRankings.A.some((r) => r.repId === resume.repId) ||
        myRankings.B.some((r) => r.repId === resume.repId) ||
        myRankings.C.some((r) => r.repId === resume.repId);
      return !isRanked;
    })
  ) : null;

  // Get current resume (first unranked or selected index)
  const currentResume =
    unrankedResumes && unrankedResumes.length > 0
      ? unrankedResumes[currentIndex] || unrankedResumes[0]
      : null;

  // Calculate progress
  const progress =
    allResumes && myRankings
      ? {
          total: allResumes.length,
          ranked:
            (myRankings.A?.length || 0) +
            (myRankings.B?.length || 0) +
            (myRankings.C?.length || 0),
          unranked:
            allResumes.length -
            ((myRankings.A?.length || 0) +
              (myRankings.B?.length || 0) +
              (myRankings.C?.length || 0)),
          percentComplete:
            (((myRankings.A?.length || 0) +
              (myRankings.B?.length || 0) +
              (myRankings.C?.length || 0)) /
              allResumes.length) *
            100,
        }
      : null;

  // Reset index when unranked resumes change
  useEffect(() => {
    if (unrankedResumes && unrankedResumes.length > 0) {
      setCurrentIndex(0);
    }
  }, [unrankedResumes?.length]);

  // Assign current resume to group
  const assignToGroup = useCallback(
    async (group: "A" | "B" | "C") => {
      if (!currentResume || !companyId) return;

      const rank =
        group === "A"
          ? myRankings?.A.length || 0
          : group === "B"
          ? myRankings?.B.length || 0
          : myRankings?.C.length || 0;

      await saveRanking({
        companyId: companyId as Id<"companies">,
        repId: currentResume.repId,
        group,
        rank,
      });

      // Move to next resume automatically
      if (unrankedResumes && currentIndex < unrankedResumes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    [currentResume, companyId, myRankings, saveRanking, currentIndex, unrankedResumes]
  );

  // Navigation
  const nextResume = useCallback(() => {
    if (unrankedResumes && currentIndex < unrankedResumes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, unrankedResumes]);

  const previousResume = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const skipResume = useCallback(() => {
    // Skip just moves to next without assigning
    nextResume();
  }, [nextResume]);

  // Move existing ranking to different group
  const moveToGroup = useCallback(
    async (repId: string, group: "A" | "B" | "C") => {
      if (!companyId) return;

      // Find current rank
      const currentGroup =
        myRankings?.A.find((r) => r.repId === repId) ||
        myRankings?.B.find((r) => r.repId === repId) ||
        myRankings?.C.find((r) => r.repId === repId);

      if (!currentGroup) {
        // Not ranked yet, add to end of group
        const rank =
          group === "A"
            ? myRankings?.A.length || 0
            : group === "B"
            ? myRankings?.B.length || 0
            : myRankings?.C.length || 0;

        await saveRanking({
          companyId: companyId as Id<"companies">,
          repId,
          group,
          rank,
        });
      } else {
        // Move to new group
        const rank =
          group === "A"
            ? myRankings?.A.length || 0
            : group === "B"
            ? myRankings?.B.length || 0
            : myRankings?.C.length || 0;

        await saveRanking({
          companyId: companyId as Id<"companies">,
          repId,
          group,
          rank,
        });
      }
    },
    [companyId, myRankings, saveRanking]
  );

  // Remove from rankings
  const removeFromRankings = useCallback(
    async (repId: string) => {
      if (!companyId) return;
      await deleteRanking({
        companyId: companyId as Id<"companies">,
        repId,
      });
    },
    [companyId, deleteRanking]
  );

  const isLoading =
    !allResumes || !myRankings;

  return {
    myRankings,
    unrankedResumes,
    currentResume,
    currentIndex,
    progress,
    assignToGroup,
    nextResume,
    previousResume,
    skipResume,
    moveToGroup,
    removeFromRankings,
    isLoading,
  };
}
