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

import { action, query, mutation, internalQuery, internalMutation } from "../_generated/server";
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
      const status = await ctx.runQuery(api.internal.admin.compilation.checkSubmissionStatus, {
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

    // Create compilation record
    const compilationId = await ctx.runMutation(api.internal.admin.compilation.createCompilationRecord, {
      gameId,
      quarter,
      phase: "hiring",
      compiledBy: user._id,
    });

    // Call internal compilation
    try {
      const result = await ctx.runAction(api.compilation.hiring._compileHiringDecisions, {
        gameId,
        quarter,
      });

      // Update compilation record with success
      await ctx.runMutation(api.internal.admin.compilation.updateCompilationRecord, {
        compilationId,
        status: "success",
        companiesProcessed: result.companiesProcessed || 0,
      });

      return result;
    } catch (error: any) {
      // Update compilation record with failure
      await ctx.runMutation(api.internal.admin.compilation.updateCompilationRecord, {
        compilationId,
        status: "failed",
        companiesProcessed: 0,
        errorMessage: error.message,
      });

      throw error;
    }
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
      const status = await ctx.runQuery(api.internal.admin.compilation.checkSubmissionStatus, {
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

    // Create compilation record
    const compilationId = await ctx.runMutation(api.internal.admin.compilation.createCompilationRecord, {
      gameId,
      quarter,
      phase: "leadership",
      compiledBy: user._id,
    });

    // Call internal compilation
    try {
      const result = await ctx.runAction(api.compilation.leadership._compileLeadershipDecisions, {
        gameId,
        quarter,
      });

      // Update compilation record with success
      await ctx.runMutation(api.internal.admin.compilation.updateCompilationRecord, {
        compilationId,
        status: "success",
        companiesProcessed: result.companiesProcessed || 0,
      });

      return result;
    } catch (error: any) {
      // Update compilation record with failure
      await ctx.runMutation(api.internal.admin.compilation.updateCompilationRecord, {
        compilationId,
        status: "failed",
        companiesProcessed: 0,
        errorMessage: error.message,
      });

      throw error;
    }
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
export const checkSubmissionStatus = internalQuery({
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
 * Get compilation history for a game
 *
 * @param gameId - The game to get history for
 * @returns List of past compilations with timestamps
 *
 * Access: Admins (any game), Teachers (assigned game only)
 */
export const getCompilationHistory = query({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    // Auth check
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Get all compilations for this game, ordered by most recent first
    const compilations = await ctx.db
      .query("compilations")
      .withIndex("by_game_quarter_phase", (q) => q.eq("gameId", gameId))
      .collect();

    // Sort by startedAt descending (most recent first)
    compilations.sort((a, b) => b.startedAt - a.startedAt);

    // Fetch user info for each compilation
    const history = await Promise.all(
      compilations.map(async (compilation) => {
        const compiledByUser = await ctx.db.get(compilation.compiledBy);
        return {
          _id: compilation._id,
          quarter: compilation.quarter,
          phase: compilation.phase,
          status: compilation.status,
          startedAt: compilation.startedAt,
          completedAt: compilation.completedAt,
          companiesProcessed: compilation.companiesProcessed,
          errorMessage: compilation.errorMessage,
          compiledBy: compiledByUser
            ? { name: compiledByUser.name, email: compiledByUser.email }
            : null,
        };
      })
    );

    return history;
  },
});

/**
 * Get current compilation status for a game/quarter/phase
 *
 * @param gameId - The game to check
 * @param quarter - The quarter number
 * @param phase - "hiring" or "leadership"
 * @returns Current compilation status or null if no compilation exists
 *
 * Access: Admins (any game), Teachers (assigned game only)
 */
export const getCompilationStatus = query({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    phase: v.union(v.literal("hiring"), v.literal("leadership")),
  },
  handler: async (ctx, { gameId, quarter, phase }) => {
    // Auth check
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Find the most recent compilation for this game/quarter/phase
    const compilations = await ctx.db
      .query("compilations")
      .withIndex("by_game_quarter_phase", (q) =>
        q.eq("gameId", gameId).eq("quarter", quarter).eq("phase", phase)
      )
      .collect();

    if (compilations.length === 0) {
      return null;
    }

    // Return the most recent one (highest startedAt)
    const compilation = compilations.reduce((latest, current) =>
      current.startedAt > latest.startedAt ? current : latest
    );

    const compiledByUser = await ctx.db.get(compilation.compiledBy);

    return {
      _id: compilation._id,
      status: compilation.status,
      startedAt: compilation.startedAt,
      completedAt: compilation.completedAt,
      companiesProcessed: compilation.companiesProcessed,
      errorMessage: compilation.errorMessage,
      compiledBy: compiledByUser
        ? { name: compiledByUser.name, email: compiledByUser.email }
        : null,
    };
  },
});

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

/**
 * Create a new compilation record
 *
 * @param gameId - The game being compiled
 * @param quarter - The quarter number
 * @param phase - "hiring" or "leadership"
 * @param compiledBy - The user who triggered the compilation
 * @returns The ID of the created compilation record
 *
 * Access: Internal use only by compilation actions
 */
export const createCompilationRecord = internalMutation({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    phase: v.union(v.literal("hiring"), v.literal("leadership")),
    compiledBy: v.id("users"),
  },
  handler: async (ctx, { gameId, quarter, phase, compiledBy }) => {
    const compilationId = await ctx.db.insert("compilations", {
      gameId,
      quarter,
      phase,
      status: "pending",
      startedAt: Date.now(),
      compiledBy,
      companiesProcessed: 0,
    });

    return compilationId;
  },
});

/**
 * Update a compilation record with results
 *
 * @param compilationId - The compilation to update
 * @param status - "success" or "failed"
 * @param companiesProcessed - Number of companies processed
 * @param errorMessage - Optional error message if failed
 *
 * Access: Internal use only by compilation actions
 */
export const updateCompilationRecord = internalMutation({
  args: {
    compilationId: v.id("compilations"),
    status: v.union(v.literal("success"), v.literal("failed")),
    companiesProcessed: v.number(),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { compilationId, status, companiesProcessed, errorMessage }) => {
    await ctx.db.patch(compilationId, {
      status,
      completedAt: Date.now(),
      companiesProcessed,
      errorMessage,
    });
  },
});

