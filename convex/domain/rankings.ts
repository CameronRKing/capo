/**
 * Resume Ranking Domain Service
 *
 * Manages individual student rankings of resume profiles.
 *
 * Key Features:
 * - Private rankings: Each student maintains their own ranking of resumes
 * - Teammate visibility: Students can see but cannot edit teammates' rankings
 * - Group-based sorting: A/B/C groups for rough sorting, refined ordering within groups
 * - Real-time collaboration: Rankings update reactively via Convex subscriptions
 *
 * Access Control (via RLS):
 * - Students: Read own + teammates' rankings, write only own rankings
 * - Teachers: Read all rankings in their game (read-only)
 * - Admins: Full access
 *
 * Data Model:
 * - Group: "A" (top tier), "B" (middle), "C" (lower)
 * - Rank: Position within group (0-based index)
 * - Combined with Borda count algorithm for company hiring list
 */

import { v } from "convex/values";
import { mutationWithRLS, queryWithRLS } from "../services/rowLevelSecurity";

/**
 * Query: Get current user's private rankings
 *
 * Returns the authenticated student's own resume rankings.
 * Used in the ranking UI for editing and refinement.
 *
 * RLS: Returns only rankings where userId === ctx.user._id
 */
export const getMyRankings = queryWithRLS({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    // RLS automatically filters to only return rankings where:
    // - For students: userId === ctx.user._id
    const rankings = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", companyId)
      )
      .collect();

    // Group by A/B/C for easier UI rendering
    const grouped = {
      A: rankings.filter((r) => r.group === "A").sort((a, b) => a.rank - b.rank),
      B: rankings.filter((r) => r.group === "B").sort((a, b) => a.rank - b.rank),
      C: rankings.filter((r) => r.group === "C").sort((a, b) => a.rank - b.rank),
    };

    return grouped;
  },
});

/**
 * Query: Get all teammates' rankings (read-only)
 *
 * Returns rankings from all students in the same company.
 * Used for real-time collaboration - students see teammates' work but cannot edit it.
 *
 * RLS: Returns rankings where companyId === ctx.user.companyId
 * - Students see all company rankings (own + teammates)
 * - Cannot edit (enforced by RLS modify rule)
 */
export const getTeammateRankings = queryWithRLS({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    // Fetch all users in the company
    const companyUsers = await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    // RLS automatically filters to return only rankings where:
    // - For students: userId === ctx.user._id OR companyId === ctx.user.companyId
    const rankings = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) => q.eq("companyId", companyId))
      .collect();

    // Group by user for collaborative view
    const byUser: Record<
      string,
      {
        userName: string;
        rankings: {
          A: typeof rankings;
          B: typeof rankings;
          C: typeof rankings;
        };
      }
    > = {};

    for (const user of companyUsers) {
      const userRankings = rankings.filter((r) => r.userId === user._id);

      byUser[user._id] = {
        userName: user.name,
        rankings: {
          A: userRankings.filter((r) => r.group === "A").sort((a, b) => a.rank - b.rank),
          B: userRankings.filter((r) => r.group === "B").sort((a, b) => a.rank - b.rank),
          C: userRankings.filter((r) => r.group === "C").sort((a, b) => a.rank - b.rank),
        },
      };
    }

    return byUser;
  },
});

/**
 * Query: Get unranked resumes
 *
 * Returns resumes that the current user hasn't ranked yet.
 * Used to track progress in the rough sorting phase.
 */
export const getUnrankedResumes = queryWithRLS({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    // Get user's current rankings
    const rankings = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", companyId)
      )
      .collect();

    const rankedRepIds = new Set(rankings.map((r) => r.repId));

    // Get all resumes and filter unranked
    const allResumes = await ctx.db.query("resumes").collect();

    return allResumes.filter((resume) => !rankedRepIds.has(resume.repId));
  },
});

/**
 * Mutation: Save or update a single resume ranking
 *
 * Upserts a ranking for a specific resume.
 * Creates new ranking if doesn't exist, updates if exists.
 *
 * RLS: Students can only modify rankings where userId === ctx.user._id
 */
export const saveRanking = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    repId: v.string(),
    group: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    rank: v.number(),
  },
  handler: async (ctx, { companyId, repId, group, rank }) => {
    // Check if ranking already exists
    const existing = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", companyId)
      )
      .filter((q) => q.eq(q.field("repId"), repId))
      .first();

    if (existing) {
      // Update existing ranking
      await ctx.db.patch(existing._id, {
        group,
        rank,
      });
      return existing._id;
    } else {
      // Create new ranking
      const rankingId = await ctx.db.insert("resumeRankings", {
        userId: ctx.user._id,
        companyId,
        repId,
        group,
        rank,
      });
      return rankingId;
    }
  },
});

/**
 * Mutation: Save multiple rankings in batch
 *
 * Batch update for drag-and-drop refinement phase.
 * Efficiently updates multiple rankings in a single operation.
 *
 * RLS: Each ranking is checked - only updates where userId === ctx.user._id
 */
export const saveRankingsBatch = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    rankings: v.array(
      v.object({
        repId: v.string(),
        group: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
        rank: v.number(),
      })
    ),
  },
  handler: async (ctx, { companyId, rankings }) => {
    const results = [];

    for (const ranking of rankings) {
      const existing = await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", ctx.user._id).eq("companyId", companyId)
        )
        .filter((q) => q.eq(q.field("repId"), ranking.repId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          group: ranking.group,
          rank: ranking.rank,
        });
        results.push(existing._id);
      } else {
        const newId = await ctx.db.insert("resumeRankings", {
          userId: ctx.user._id,
          companyId,
          repId: ranking.repId,
          group: ranking.group,
          rank: ranking.rank,
        });
        results.push(newId);
      }
    }

    return results;
  },
});

/**
 * Mutation: Delete a ranking
 *
 * Removes a resume from user's rankings (e.g., moved from A to unranked).
 * Used when students change their minds during sorting.
 */
export const deleteRanking = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    repId: v.string(),
  },
  handler: async (ctx, { companyId, repId }) => {
    const existing = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", companyId)
      )
      .filter((q) => q.eq(q.field("repId"), repId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }

    return false;
  },
});

/**
 * Query: Get ranking summary for a user
 *
 * Returns count of rankings per group for progress tracking.
 * Used to show completion status in UI.
 */
export const getRankingSummary = queryWithRLS({
  args: {
    userId: v.id("users"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, { userId, companyId }) => {
    const rankings = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) => q.eq("userId", userId).eq("companyId", companyId))
      .collect();

    return {
      total: rankings.length,
      A: rankings.filter((r) => r.group === "A").length,
      B: rankings.filter((r) => r.group === "B").length,
      C: rankings.filter((r) => r.group === "C").length,
    };
  },
});

/**
 * Query: Check if user has completed ranking
 *
 * Simple boolean check for UI state (e.g., enable/disable submit button).
 */
export const hasCompletedRanking = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    minRequired: v.optional(v.number()), // Optional minimum count
  },
  handler: async (ctx, { companyId, minRequired = 10 }) => {
    const rankings = await ctx.db
      .query("resumeRankings")
      .withIndex("by_user_company", (q) =>
        q.eq("userId", ctx.user._id).eq("companyId", companyId)
      )
      .collect();

    return rankings.length >= minRequired;
  },
});

/**
 * Query: Get combined hiring list for a company
 *
 * Returns the Borda count combined ranking for a company in a specific quarter.
 * Used in hiring decision forms to show the ordered hiring list.
 *
 * RLS: Students can read their company's hiring list
 */
export const getHiringList = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const hiringList = await ctx.db
      .query("hiringLists")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return hiringList?.repIds ?? [];
  },
});

/**
 * Mutation: Generate combined hiring list using Borda count
 *
 * Combines all student rankings for a company into a single ordered hiring list.
 * Uses the Borda count algorithm to merge rankings democratically.
 *
 * Process:
 * 1. Fetch all student rankings for the company
 * 2. Fetch all resume names (for tie-breaking)
 * 3. Apply Borda count algorithm
 * 4. Store result in hiringLists table
 *
 * Can be called by:
 * - Teachers: To generate hiring list for their companies
 * - Admins: Full access
 *
 * RLS: Teachers can generate for companies in their game
 */
export const generateHiringList = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Import algorithm functions
    const { calculateCompanyHiringList } = await import("./rankings/algorithm");

    // Fetch all users in the company
    const companyUsers = await ctx.db
      .query("users")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();

    // Fetch all rankings for all students in the company
    const studentRankings = new Map<string, Array<Doc<"resumeRankings">>>();

    for (const user of companyUsers) {
      const rankings = await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", user._id).eq("companyId", companyId)
        )
        .collect();

      if (rankings.length > 0) {
        studentRankings.set(user._id, rankings);
      }
    }

    // Fetch all resume names (for tie-breaking)
    const allResumes = await ctx.db.query("resumes").collect();
    const resumeNames = new Map<string, string>();
    for (const resume of allResumes) {
      resumeNames.set(resume.repId, resume.name);
    }

    // Apply Borda count algorithm
    const orderedRepIds = calculateCompanyHiringList(studentRankings, resumeNames);

    // Check if hiring list already exists
    const existing = await ctx.db
      .query("hiringLists")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (existing) {
      // Update existing hiring list
      await ctx.db.patch(existing._id, {
        repIds: orderedRepIds,
      });
      return existing._id;
    } else {
      // Create new hiring list
      const hiringListId = await ctx.db.insert("hiringLists", {
        companyId,
        quarter,
        repIds: orderedRepIds,
      });
      return hiringListId;
    }
  },
});
