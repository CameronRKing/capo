/**
 * Borda Count Algorithm for Resume Ranking Combination
 *
 * Combines individual student rankings into a single company hiring list using
 * the modified Borda count voting system.
 *
 * Algorithm Overview:
 * 1. Convert group-based rankings (A/B/C) to ordinal positions
 * 2. Assign points: (N - position) where N = total resumes ranked
 * 3. Sum points across all students for each resume
 * 4. Sort by total points descending (highest points = highest rank)
 * 5. Tie-breaking: alphabetical by rep name
 *
 * Legacy Reference:
 * - Based on App\RepRankingCombiner from legacy PHP implementation
 * - Groups (A/B/C) are UI affordance only - algorithm uses ordinal positions
 * - Points formula: (70 - position) / 70 normalized (legacy)
 * - Simplified to: (N - position) for cleaner implementation
 *
 * Edge Cases Handled:
 * - Incomplete rankings: Some reps not ranked by some students
 * - Different group sizes: A might have 10, B might have 20, C might have 40
 * - Empty rankings: Students who haven't ranked anyone yet
 * - Ties: Broken alphabetically by rep name
 */

import { Doc } from "../_generated/dataModel";

/**
 * Represents a student's ranking with its ordinal position
 */
interface RankedResume {
  repId: string;
  position: number; // 0-based ordinal position across all groups
  group: "A" | "B" | "C";
  rank: number; // Position within group
}

/**
 * Represents accumulated points for a resume across all students
 */
interface ResumeScore {
  repId: string;
  totalPoints: number;
  studentCount: number; // Number of students who ranked this resume
}

/**
 * Convert group-based rankings to ordinal positions
 *
 * Groups are ordered: A (top), B (middle), C (bottom)
 * Within each group, rank determines position (0-based)
 *
 * Example:
 * - A group with 3 resumes: positions 0, 1, 2
 * - B group with 2 resumes: positions 3, 4
 * - C group with 1 resume: position 5
 *
 * @param rankings - Array of rankings from a single student
 * @returns Array of ranked resumes with ordinal positions
 */
export function convertToOrdinalPositions(rankings: Array<{
  repId: string;
  group: "A" | "B" | "C";
  rank: number;
}>): RankedResume[] {
  // Sort by group (A < B < C) and then by rank within group
  const groupOrder = { A: 0, B: 1, C: 2 };

  const sorted = [...rankings].sort((a, b) => {
    const groupDiff = groupOrder[a.group] - groupOrder[b.group];
    if (groupDiff !== 0) return groupDiff;
    return a.rank - b.rank;
  });

  // Assign ordinal positions
  return sorted.map((ranking, index) => ({
    repId: ranking.repId,
    position: index,
    group: ranking.group,
    rank: ranking.rank,
  }));
}

/**
 * Calculate Borda count points for a single resume ranking
 *
 * Points formula: (N - position)
 * - N = total resumes ranked by this student
 * - position = 0-based ordinal position
 *
 * Example with 70 resumes:
 * - Position 0 (top): 70 - 0 = 70 points
 * - Position 1: 70 - 1 = 69 points
 * - Position 69 (bottom): 70 - 69 = 1 point
 *
 * This gives higher points to higher-ranked resumes.
 *
 * @param position - 0-based ordinal position
 * @param totalRanked - Total number of resumes ranked by this student
 * @returns Points for this ranking
 */
export function calculatePoints(position: number, totalRanked: number): number {
  return totalRanked - position;
}

/**
 * Combine multiple student rankings using Borda count
 *
 * Process:
 * 1. For each student: Convert rankings to ordinal positions and calculate points
 * 2. Sum points across all students for each resume
 * 3. Sort by total points descending
 * 4. Break ties alphabetically by rep ID (as proxy for name)
 *
 * @param allRankings - Array of student ranking arrays
 * @param repNames - Map of repId to name for tie-breaking
 * @returns Ordered array of rep IDs from highest to lowest rank
 */
export function bordaCount(
  allRankings: Array<Array<{
    repId: string;
    group: "A" | "B" | "C";
    rank: number;
  }>>,
  repNames: Map<string, string>
): string[] {
  // Accumulate points for each resume
  const scores = new Map<string, ResumeScore>();

  for (const studentRankings of allRankings) {
    // Skip students with no rankings
    if (studentRankings.length === 0) {
      continue;
    }

    // Convert to ordinal positions
    const ranked = convertToOrdinalPositions(studentRankings);
    const totalRanked = ranked.length;

    // Calculate and accumulate points
    for (const resume of ranked) {
      const points = calculatePoints(resume.position, totalRanked);

      const existing = scores.get(resume.repId);
      if (existing) {
        existing.totalPoints += points;
        existing.studentCount += 1;
      } else {
        scores.set(resume.repId, {
          repId: resume.repId,
          totalPoints: points,
          studentCount: 1,
        });
      }
    }
  }

  // Convert to array for sorting
  const scoredResumes = Array.from(scores.values());

  // Sort by total points descending, then alphabetically by rep name
  scoredResumes.sort((a, b) => {
    // Primary sort: total points (higher is better)
    if (a.totalPoints !== b.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }

    // Secondary sort: alphabetical by rep name for tie-breaking
    const nameA = repNames.get(a.repId) ?? a.repId;
    const nameB = repNames.get(b.repId) ?? b.repId;

    return nameA.localeCompare(nameB);
  });

  // Return ordered list of rep IDs
  return scoredResumes.map((score) => score.repId);
}

/**
 * Calculate Borda count for a single company
 *
 * This is the main entry point for the ranking combination algorithm.
 * It fetches all student rankings for a company and combines them.
 *
 * @param studentRankings - Map of userId to their rankings
 * @param resumeNames - Map of repId to resume name for tie-breaking
 * @returns Ordered array of rep IDs (hiring list)
 */
export function calculateCompanyHiringList(
  studentRankings: Map<string, Array<Doc<"resumeRankings">>>,
  resumeNames: Map<string, string>
): string[] {
  // Convert Map values to array of ranking arrays
  const allRankings = Array.from(studentRankings.values()).map((rankings) =>
    rankings.map((r) => ({
      repId: r.repId,
      group: r.group,
      rank: r.rank,
    }))
  );

  // Apply Borda count algorithm
  return bordaCount(allRankings, resumeNames);
}
