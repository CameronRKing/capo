/**
 * Student Dashboard Domain Module
 *
 * Provides queries for the student dashboard overview including:
 * - Company stats and game context
 * - Current phase and quarter
 * - Upcoming decision deadlines
 * - Notification counts
 *
 * Access Control:
 * - All queries use RLS (Row-Level Security)
 * - Students can only read their own company data
 * - Teachers can read all companies in their game
 * - Admins can read all data
 */

import { queryWithRLS } from "../services/rowLevelSecurity";
import { v } from "convex/values";
import { getCurrentPhase as getGamePhase } from "../domain/games";
import { Id } from "../_generated/dataModel";

/**
 * Re-export getCurrentPhase from games domain
 *
 * This query already exists in the games domain and provides
 * the current quarter and phase for a game.
 */
export { getCurrentPhase as getGamePhase } from "../domain/games";

/**
 * Query: Get dashboard data for a company
 *
 * Fetches comprehensive dashboard data including:
 * - Company information (name, industry)
 * - Game context (current quarter, phase, status)
 * - Basic stats (number of active reps, etc.)
 *
 * Access Control (via RLS):
 * - Students: Can only read their own company
 * - Teachers: Can read companies in their game
 * - Admins: Can read any company
 *
 * @param companyId - The ID of the company to fetch dashboard data for
 * @returns Dashboard object with company, game, and stats
 */
export const getDashboardData = queryWithRLS({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    // Fetch company
    const company = await ctx.db.get(companyId);
    if (!company) {
      return null;
    }

    // Fetch game
    const game = await ctx.db.get(company.gameId);
    if (!game) {
      return null;
    }

    // Calculate basic stats
    const activeReps = await ctx.db
      .query("activeReps")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", game.currentQuarter)
      )
      .collect();

    const stats = {
      activeRepsCount: activeReps.length,
      currentQuarter: game.currentQuarter,
      currentPhase: game.currentPhase,
      gameStatus: game.status,
    };

    return {
      company,
      game,
      stats,
    };
  },
});

/**
 * Query: Get upcoming deadlines for a company
 *
 * Calculates upcoming decision submission deadlines based on:
 * - Current game phase (hiring or leadership)
 * - Whether decisions have been submitted
 * - Time until next phase/quarter (placeholder - requires game schedule config)
 *
 * Returns an array of deadline objects with:
 * - type: "hiring" or "leadership"
 * - quarter: Quarter number
 * - status: "submitted" | "pending" | "overdue"
 * - submittedAt: Timestamp if submitted (optional)
 * - submittedBy: User who submitted (optional)
 *
 * Access Control (via RLS):
 * - Students: Can only read their own company's deadlines
 * - Teachers: Can read deadlines for companies in their game
 * - Admins: Can read any deadlines
 *
 * @param companyId - The ID of the company to fetch deadlines for
 * @returns Array of deadline objects
 */
export const getUpcomingDeadlines = queryWithRLS({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    // Fetch company to get game ID
    const company = await ctx.db.get(companyId);
    if (!company) {
      return [];
    }

    // Fetch game to get current quarter and phase
    const game = await ctx.db.get(company.gameId);
    if (!game) {
      return [];
    }

    const { currentQuarter, currentPhase } = game;
    const deadlines = [];

    // Check hiring decision deadline for current quarter
    const hiringDecision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", currentQuarter)
      )
      .first();

    if (hiringDecision) {
      deadlines.push({
        type: "hiring" as const,
        quarter: currentQuarter,
        status: hiringDecision.isSubmitted ? ("submitted" as const) : ("pending" as const),
        submittedAt: hiringDecision.submittedAt,
        submittedBy: hiringDecision.submittedBy,
      });
    } else {
      // No decision record yet - pending
      deadlines.push({
        type: "hiring" as const,
        quarter: currentQuarter,
        status: "pending" as const,
        submittedAt: undefined,
        submittedBy: undefined,
      });
    }

    // Check leadership decision deadline for current quarter
    const leadershipDecision = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", currentQuarter)
      )
      .first();

    if (leadershipDecision) {
      deadlines.push({
        type: "leadership" as const,
        quarter: currentQuarter,
        status: leadershipDecision.isSubmitted ? ("submitted" as const) : ("pending" as const),
        submittedAt: leadershipDecision.submittedAt,
        submittedBy: leadershipDecision.submittedBy,
      });
    } else {
      // No decision record yet - pending
      deadlines.push({
        type: "leadership" as const,
        quarter: currentQuarter,
        status: "pending" as const,
        submittedAt: undefined,
        submittedBy: undefined,
      });
    }

    return deadlines;
  },
});

/**
 * Query: Get notification count for a user
 *
 * Counts unread notifications for a user.
 * NOTE: Currently a placeholder as the notification system is not yet implemented.
 * Returns 0 until the notification feature is built.
 *
 * Future implementation will:
 * - Query a notifications table filtered by user and read status
 * - Return count of unread notifications
 *
 * Access Control (via RLS):
 * - Users can only read their own notification count
 *
 * @param userId - The ID of the user to fetch notification count for
 * @returns Number of unread notifications
 */
export const getNotificationCount = queryWithRLS({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Placeholder: Notification system not yet implemented
    // Future: Query notifications table and count unread
    // const notifications = await ctx.db
    //   .query("notifications")
    //   .withIndex("by_user_read", (q) =>
    //     q.eq("userId", userId).eq("isRead", false)
    //   )
    //   .collect();
    // return notifications.length;

    return 0;
  },
});
