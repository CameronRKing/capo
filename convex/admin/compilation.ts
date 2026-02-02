/**
 * Admin Compilation Functions
 *
 * Provides secure wrapper functions for triggering compilation processes.
 * Only admins and teachers can trigger compilation, with teachers limited
 * to their assigned game.
 *
 * These functions check:
 * 1. User authentication and role (admin/teacher only)
 * 2. Game access (teachers: their assigned game only)
 * 3. Submission completion (optional, via proceedWithDefaults)
 */

import { action, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { getCurrentUser, hasRole, canAccessGame } from "../services/permissions";

/**
 * Compile hiring decisions for a game/quarter
 *
 * @param gameId - The game to compile
 * @param quarter - The quarter number (1-8)
 * @param proceedWithDefaults - If true, compile even if not all companies submitted
 * @returns Compilation result or submission status warning
 *
 * Access: Admins (any game), Teachers (assigned game only)
 */
export const compileHiringDecisions = action({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    proceedWithDefaults: v.optional(v.boolean()),
  },
  handler: async (ctx, { gameId, quarter, proceedWithDefaults }) => {
    // Auth checks
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Check submission status (warn if incomplete)
    if (!proceedWithDefaults) {
      const status = await ctx.runQuery(api.admin.compilation.checkSubmissionStatus, {
        gameId,
        quarter,
        phase: "hiring",
      });

      if (status.missingCompanies.length > 0) {
        return {
          canProceed: false,
          status,
          message: `${status.submittedCompanies}/${status.totalCompanies} companies submitted. Use proceedWithDefaults=true to compile anyway.`,
        };
      }
    }

    // Call internal compilation
    return await ctx.runAction(api.compilation.hiring._compileHiringDecisions, {
      gameId,
      quarter,
    });
  },
});

/**
 * Compile leadership decisions for a game/quarter
 *
 * @param gameId - The game to compile
 * @param quarter - The quarter number (1-8)
 * @param proceedWithDefaults - If true, compile even if not all companies submitted
 * @returns Compilation result or submission status warning
 *
 * Access: Admins (any game), Teachers (assigned game only)
 */
export const compileLeadershipDecisions = action({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    proceedWithDefaults: v.optional(v.boolean()),
  },
  handler: async (ctx, { gameId, quarter, proceedWithDefaults }) => {
    // Auth checks
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Check submission status
    if (!proceedWithDefaults) {
      const status = await ctx.runQuery(api.admin.compilation.checkSubmissionStatus, {
        gameId,
        quarter,
        phase: "leadership",
      });

      if (status.missingCompanies.length > 0) {
        return {
          canProceed: false,
          status,
          message: `${status.submittedCompanies}/${status.totalCompanies} companies submitted. Use proceedWithDefaults=true to compile anyway.`,
        };
      }
    }

    // Call internal compilation
    return await ctx.runAction(api.compilation.leadership._compileLeadershipDecisions, {
      gameId,
      quarter,
    });
  },
});

/**
 * Check submission status for a game/quarter/phase
 *
 * @param gameId - The game to check
 * @param quarter - The quarter number (1-8)
 * @param phase - "hiring" or "leadership"
 * @returns Submission status with list of missing companies
 *
 * Access: Admins (any game), Teachers (assigned game only)
 */
export const checkSubmissionStatus = query({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    phase: v.union(v.literal("hiring"), v.literal("leadership")),
  },
  handler: async (ctx, { gameId, quarter, phase }) => {
    // Auth check (read-only, so teachers can check their games)
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Get all companies in game
    const companies = await ctx.runQuery(api.internal.listGameCompanies, { gameId });

    const submittedCompanies: Array<{ companyId: string; name: string }> = [];
    const missingCompanies: Array<{ companyId: string; name: string }> = [];

    for (const company of companies) {
      let submitted = false;

      if (phase === "hiring") {
        const decision = await ctx.runQuery(api.internal.getHiringDecision, {
          companyId: company._id,
          quarter,
        });
        submitted = decision?.submittedAt !== undefined;
      } else {
        const decision = await ctx.runQuery(api.internal.getLeadershipDecision, {
          companyId: company._id,
          quarter,
        });
        submitted = decision?.submittedAt !== undefined;
      }

      if (submitted) {
        submittedCompanies.push({ companyId: company._id, name: company.name });
      } else {
        missingCompanies.push({ companyId: company._id, name: company.name });
      }
    }

    return {
      totalCompanies: companies.length,
      submittedCompanies: submittedCompanies.length,
      missingCompanies: missingCompanies.length,
      missing: missingCompanies,
      canProceedWithDefaults: true,
    };
  },
});

/**
 * Helper: Require user has admin or teacher role
 */
async function requireAdminOrTeacher(ctx: any): Promise<any> {
  const user = await getCurrentUser(ctx);

  if (!hasRole(user, ["admin", "teacher"])) {
    throw new Error("Forbidden: Only admins and teachers can trigger compilation");
  }

  return user;
}

/**
 * Helper: Check teacher can access this game
 */
async function requireGameAccess(ctx: any, user: any, gameId: string) {
  if (user.role === "admin") return; // Admins can access all games

  if (user.role === "teacher") {
    if (user.gameId !== gameId) {
      throw new Error(`Forbidden: You can only compile your assigned game`);
    }
  }
}
