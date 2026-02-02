/**
 * Teacher Dashboard Domain Functions
 *
 * Provides queries for teacher dashboard with aggregated game stats,
 * company submission status, deadlines, and activity feeds.
 *
 * Access Control:
 * - Uses queryWithRLS for automatic filtering
 * - Teachers can only see their assigned game
 * - ctx.user available for business logic
 */

import { queryWithRLS } from "../services/rowLevelSecurity";
import { v } from "convex/values";

/**
 * Query: Get dashboard data for a game
 *
 * Aggregates game information, company count, and submission summary.
 * Teachers can only query their assigned game (enforced by RLS).
 *
 * @param gameId - The game ID to fetch dashboard data for
 * @returns Dashboard summary with game info, company counts, and submission status
 *
 * Example:
 * ```tsx
 * const dashboardData = useQuery(api.teacher.dashboard.getDashboardData, { gameId });
 * // Returns: { game, companyCount, submittedCount, pendingCount, currentPhase }
 * ```
 */
export const getDashboardData = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    // Get game info
    const game = await ctx.db.get(gameId);
    if (!game) {
      return null;
    }

    // Get all companies in the game
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Count submissions for current phase
    let submittedCount = 0;
    const currentQuarter = game.currentQuarter;
    const currentPhase = game.currentPhase;

    for (const company of companies) {
      if (currentPhase === "hiring") {
        const decision = await ctx.db
          .query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company._id).eq("quarter", currentQuarter)
          )
          .first();

        if (decision?.isSubmitted) {
          submittedCount++;
        }
      } else if (currentPhase === "leadership") {
        const decision = await ctx.db
          .query("leadershipDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company._id).eq("quarter", currentQuarter)
          )
          .first();

        if (decision?.isSubmitted) {
          submittedCount++;
        }
      }
    }

    return {
      game: {
        _id: game._id,
        name: game.name,
        currentQuarter: game.currentQuarter,
        currentPhase: game.currentPhase,
        status: game.status,
        length: game.length,
      },
      companyCount: companies.length,
      submittedCount,
      pendingCount: companies.length - submittedCount,
      currentPhase: game.currentPhase,
    };
  },
});

/**
 * Query: Get company statuses for a game
 *
 * Lists all companies in the game with their submission status
 * for both hiring and leadership phases.
 *
 * @param gameId - The game ID to fetch company statuses for
 * @returns Array of company statuses with submission state
 *
 * Example:
 * ```tsx
 * const companies = useQuery(api.teacher.dashboard.getCompanyStatuses, { gameId });
 * // Returns: [{ companyId, name, industry, hiringSubmitted, leadershipSubmitted, lastActivity }, ...]
 * ```
 */
export const getCompanyStatuses = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    // Get game to determine current quarter
    const game = await ctx.db.get(gameId);
    if (!game) {
      return [];
    }

    const currentQuarter = game.currentQuarter;

    // Get all companies in the game
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Get submission status for each company
    const companyStatuses = await Promise.all(
      companies.map(async (company) => {
        // Check hiring decision submission
        const hiringDecision = await ctx.db
          .query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company._id).eq("quarter", currentQuarter)
          )
          .first();

        // Check leadership decision submission
        const leadershipDecision = await ctx.db
          .query("leadershipDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company._id).eq("quarter", currentQuarter)
          )
          .first();

        // Determine last activity timestamp
        const timestamps = [
          hiringDecision?.submittedAt,
          leadershipDecision?.submittedAt,
          hiringDecision?._creationTime,
          leadershipDecision?._creationTime,
        ].filter((ts): ts is number => ts !== undefined);

        const lastActivity = timestamps.length > 0
          ? Math.max(...timestamps)
          : company._creationTime;

        return {
          companyId: company._id,
          name: company.name,
          industry: company.industry,
          hiringSubmitted: hiringDecision?.isSubmitted ?? false,
          leadershipSubmitted: leadershipDecision?.isSubmitted ?? false,
          lastActivity,
        };
      })
    );

    // Sort by last activity desc (most recent first)
    return companyStatuses.sort((a, b) => b.lastActivity - a.lastActivity);
  },
});

/**
 * Query: Get upcoming deadlines for a game
 *
 * Derives deadlines from game state since no explicit deadline
 * tracking exists in the schema. Returns current phase info and
 * estimated schedule.
 *
 * @param gameId - The game ID to fetch deadlines for
 * @returns Deadlines and schedule information
 *
 * Example:
 * ```tsx
 * const deadlines = useQuery(api.teacher.dashboard.getUpcomingDeadlines, { gameId });
 * // Returns: { currentPhase, quarter, nextPhase, estimatedDeadlines }
 * ```
 */
export const getUpcomingDeadlines = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) {
      return null;
    }

    const { currentQuarter, currentPhase, status, length } = game;

    // Determine next phase
    const nextPhase = currentPhase === "hiring" ? "leadership" : "hiring";
    const nextQuarter = currentPhase === "leadership" ? currentQuarter + 1 : currentQuarter;

    // Game is complete if past length
    const isComplete = status === "completed" || currentQuarter > length;

    return {
      currentPhase,
      quarter: currentQuarter,
      nextPhase: isComplete ? null : nextPhase,
      nextQuarter: isComplete ? null : nextQuarter,
      gameLength: length,
      status,
      estimatedDeadlines: [
        {
          label: "Current Phase",
          phase: currentPhase,
          quarter: currentQuarter,
          isCurrent: true,
        },
        ...(isComplete ? [] : [{
          label: "Next Phase",
          phase: nextPhase,
          quarter: nextQuarter,
          isCurrent: false,
        }]),
      ],
    };
  },
});

/**
 * Query: Get recent activity for a game
 *
 * Aggregates recent submissions and other activities. Sorts by
 * timestamp descending and limits results.
 *
 * @param gameId - The game ID to fetch activity for
 * @param limit - Maximum number of activities to return (default: 10)
 * @returns Array of recent activities
 *
 * Example:
 * ```tsx
 * const activity = useQuery(api.teacher.dashboard.getRecentActivity, { gameId, limit: 10 });
 * // Returns: [{ type, companyId, companyName, timestamp, description }, ...]
 * ```
 */
export const getRecentActivity = queryWithRLS({
  args: {
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { gameId, limit = 10 }) => {
    // Get game to determine current quarter
    const game = await ctx.db.get(gameId);
    if (!game) {
      return [];
    }

    const currentQuarter = game.currentQuarter;

    // Get all companies in the game
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Collect all recent activities
    const activities: Array<{
      type: "hiring_submit" | "leadership_submit";
      companyId: string;
      companyName: string;
      timestamp: number;
      description: string;
    }> = [];

    for (const company of companies) {
      // Check hiring decision
      const hiringDecision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", company._id).eq("quarter", currentQuarter)
        )
        .first();

      if (hiringDecision?.submittedAt) {
        activities.push({
          type: "hiring_submit",
          companyId: company._id,
          companyName: company.name,
          timestamp: hiringDecision.submittedAt,
          description: `Hiring decisions submitted`,
        });
      }

      // Check leadership decision
      const leadershipDecision = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", company._id).eq("quarter", currentQuarter)
        )
        .first();

      if (leadershipDecision?.submittedAt) {
        activities.push({
          type: "leadership_submit",
          companyId: company._id,
          companyName: company.name,
          timestamp: leadershipDecision.submittedAt,
          description: `Leadership decisions submitted`,
        });
      }
    }

    // Sort by timestamp desc (most recent first) and limit
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});
