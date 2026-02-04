/**
 * Teacher Monitoring Domain Functions
 *
 * Provides queries for tracking student progress, activity, and engagement.
 * Enables teachers to monitor individual students, compare decisions across
 * companies, and track real-time presence.
 *
 * Access Control:
 * - Uses queryWithRLS for automatic filtering
 * - Teachers can only see students in their assigned game
 * - ctx.user available for business logic
 */

import { queryWithRLS } from "../services/rowLevelSecurity";
import { v } from "convex/values";

/**
 * Query: Get student progress for a game
 *
 * Returns all students in the game with their company assignments,
 * submission status, and last activity timestamps. Enables teachers
 * to track which students are engaged and who needs support.
 *
 * @param gameId - The game ID to fetch student progress for
 * @returns Array of student progress records
 *
 * Example:
 * ```tsx
 * const students = useQuery(api.teacher.monitoring.getStudentProgress, { gameId });
 * // Returns: [{ userId, name, email, companyId, companyName, lastActivity, hasSubmittedCurrentPhase }, ...]
 * ```
 */
export const getStudentProgress = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    // Get game to determine current quarter and phase
    const game = await ctx.db.get(gameId);
    if (!game) {
      return [];
    }

    const currentQuarter = game.currentQuarter;
    const currentPhase = game.currentPhase;

    // Get all students in the game
    const students = await ctx.db
      .query("users")
      .withIndex("by_game", (q) => q.eq("gameId", gameId).eq("role", "student"))
      .collect();

    // Get progress for each student
    const studentProgress = await Promise.all(
      students.map(async (student) => {
        if (!student.companyId) {
          return {
            userId: student._id,
            name: student.name,
            email: student.email,
            companyId: null,
            companyName: null,
            lastActivity: student._creationTime,
            hasSubmittedCurrentPhase: false,
          };
        }

        // Type guard: companyId is now guaranteed to be defined
        const companyId = student.companyId;

        // Get company info
        const company = await ctx.db.get(companyId);

        // Check submission status for current phase
        let hasSubmitted = false;
        let lastActivity = student._creationTime;

        if (currentPhase === "hiring") {
          const hiringDecision = await ctx.db
            .query("hiringDecisions")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", companyId).eq("quarter", currentQuarter)
            )
            .first();

          hasSubmitted = hiringDecision?.isSubmitted ?? false;
          if (hiringDecision?.submittedAt) {
            lastActivity = hiringDecision.submittedAt;
          }
        } else if (currentPhase === "leadership") {
          const leadershipDecision = await ctx.db
            .query("leadershipDecisions")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", companyId).eq("quarter", currentQuarter)
            )
            .first();

          hasSubmitted = leadershipDecision?.isSubmitted ?? false;
          if (leadershipDecision?.submittedAt) {
            lastActivity = leadershipDecision.submittedAt;
          }
        }

        return {
          userId: student._id,
          name: student.name,
          email: student.email,
          companyId: companyId,
          companyName: company?.name ?? null,
          lastActivity,
          hasSubmittedCurrentPhase: hasSubmitted,
        };
      })
    );

    // Sort by last activity desc (most recent first)
    return studentProgress.sort((a, b) => b.lastActivity - a.lastActivity);
  },
});

/**
 * Query: Get inactive students for a game
 *
 * Identifies students who haven't submitted decisions in the specified
 * number of days. Helps teachers identify at-risk or disengaged students.
 *
 * @param gameId - The game ID to check for inactive students
 * @param days - Number of days of inactivity (default: 7)
 * @returns Array of inactive students with last activity details
 *
 * Example:
 * ```tsx
 * const inactiveStudents = useQuery(api.teacher.monitoring.getInactiveStudents, { gameId, days: 7 });
 * // Returns: [{ userId, name, email, companyId, companyName, daysSinceLastActivity, lastActivity }, ...]
 * ```
 */
export const getInactiveStudents = queryWithRLS({
  args: {
    gameId: v.id("games"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { gameId, days = 7 }) => {
    // Get game to determine current quarter
    const game = await ctx.db.get(gameId);
    if (!game) {
      return [];
    }

    const currentQuarter = game.currentQuarter;
    const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all students in the game
    const students = await ctx.db
      .query("users")
      .withIndex("by_game", (q) => q.eq("gameId", gameId).eq("role", "student"))
      .collect();

    // Check each student's activity
    const inactiveStudents = await Promise.all(
      students.map(async (student) => {
        if (!student.companyId) {
          return null;
        }

        // Type guard: companyId is now guaranteed to be defined
        const companyId = student.companyId;

        // Find most recent activity in current quarter
        let lastActivity = student._creationTime;

        const hiringDecision = await ctx.db
          .query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", currentQuarter)
          )
          .first();

        if (hiringDecision?.submittedAt && hiringDecision.submittedAt > lastActivity) {
          lastActivity = hiringDecision.submittedAt;
        }

        const leadershipDecision = await ctx.db
          .query("leadershipDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", currentQuarter)
          )
          .first();

        if (leadershipDecision?.submittedAt && leadershipDecision.submittedAt > lastActivity) {
          lastActivity = leadershipDecision.submittedAt;
        }

        // Check if inactive
        if (lastActivity < cutoffTime) {
          const company = await ctx.db.get(companyId);
          const daysSinceLastActivity = Math.floor((Date.now() - lastActivity) / (24 * 60 * 60 * 1000));

          return {
            userId: student._id,
            name: student.name,
            email: student.email,
            companyId: companyId,
            companyName: company?.name ?? null,
            daysSinceLastActivity,
            lastActivity,
          };
        }

        return null;
      })
    );

    // Filter out nulls and sort by days inactive desc
    return inactiveStudents
      .filter((student): student is NonNullable<typeof student> => student !== null)
      .sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity);
  },
});

/**
 * Query: Compare decisions across companies for a quarter
 *
 * Aggregates decision data from all companies to compare choices
 * side-by-side. Useful for class discussions about different strategies.
 *
 * @param gameId - The game ID to compare decisions for
 * @param quarter - The quarter to compare (defaults to current quarter)
 * @returns Array of company decision summaries
 *
 * Example:
 * ```tsx
 * const comparison = useQuery(api.teacher.monitoring.getDecisionComparison, { gameId, quarter: 1 });
 * // Returns: [{ companyId, companyName, hiringDecision, leadershipDecision, submissionTime }, ...]
 * ```
 */
export const getDecisionComparison = queryWithRLS({
  args: {
    gameId: v.id("games"),
    quarter: v.optional(v.number()),
  },
  handler: async (ctx, { gameId, quarter }) => {
    // Get game to determine quarter
    const game = await ctx.db.get(gameId);
    if (!game) {
      return [];
    }

    const targetQuarter = quarter ?? game.currentQuarter;

    // Get all companies in the game
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Get decisions for each company
    const comparison = await Promise.all(
      companies.map(async (company) => {
        // Get hiring decision
        const hiringDecision = await ctx.db
          .query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company._id).eq("quarter", targetQuarter)
          )
          .first();

        // Get leadership decision
        const leadershipDecision = await ctx.db
          .query("leadershipDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company._id).eq("quarter", targetQuarter)
          )
          .first();

        // Determine submission time
        const submissionTimes = [
          hiringDecision?.submittedAt,
          leadershipDecision?.submittedAt,
        ].filter((ts): ts is number => ts !== undefined);

        const submissionTime = submissionTimes.length > 0
          ? Math.min(...submissionTimes)
          : null;

        return {
          companyId: company._id,
          companyName: company.name,
          industry: company.industry,
          hiringDecision: hiringDecision ?? null,
          leadershipDecision: leadershipDecision ?? null,
          submissionTime,
        };
      })
    );

    // Sort by submission time (submitted first, then by time)
    return comparison.sort((a, b) => {
      if (a.submissionTime === null && b.submissionTime === null) return 0;
      if (a.submissionTime === null) return 1;
      if (b.submissionTime === null) return -1;
      return a.submissionTime - b.submissionTime;
    });
  },
});

/**
 * Query: Get real-time presence by company
 *
 * Returns which students are currently active in each company based on
 * presence focus data. Useful for monitoring collaboration and engagement.
 *
 * @param gameId - The game ID to get presence for
 * @returns Array of companies with active users
 *
 * Example:
 * ```tsx
 * const presence = useQuery(api.teacher.monitoring.getPresenceByCompany, { gameId });
 * // Returns: [{ companyId, companyName, activeUsers: [{ userId, name, fieldId, timestamp }] }, ...]
 * ```
 */
export const getPresenceByCompany = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    // Get all companies in the game
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Get presence for each company
    const presenceByCompany = await Promise.all(
      companies.map(async (company) => {
        // Get all users in the company
        const users = await ctx.db
          .query("users")
          .withIndex("by_company", (q) => q.eq("companyId", company._id))
          .collect();

        // Get active presence for each user (last 5 minutes)
        const cutoffTime = Date.now() - 5 * 60 * 1000;
        const activeUsers: Array<{
          userId: string;
          name: string;
          fieldId: string;
          timestamp: number;
        }> = [];

        for (const user of users) {
          const presenceEntries = await ctx.db
            .query("presenceFocus")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .collect();

          // Find most recent presence
          for (const entry of presenceEntries) {
            if (entry.timestamp > cutoffTime) {
              activeUsers.push({
                userId: user._id,
                name: user.name,
                fieldId: entry.fieldId,
                timestamp: entry.timestamp,
              });
              break; // Only count each user once
            }
          }
        }

        return {
          companyId: company._id,
          companyName: company.name,
          activeUsers,
          activeCount: activeUsers.length,
        };
      })
    );

    // Sort by active count desc
    return presenceByCompany.sort((a, b) => b.activeCount - a.activeCount);
  },
});
