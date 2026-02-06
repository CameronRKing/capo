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

import { action, query, ActionCtx, QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { getCurrentUser, hasRole, User } from "../services/permissions";

// Type definitions for compilation results
interface HiringCompilationResult {
  success: boolean;
  companiesProcessed: number;
  poachingEvents: number;
  hiringEvents: number;
  errors: string[];
}

interface LeadershipCompilationResult {
  success: boolean;
  companiesProcessed: number;
  repsProcessed: number;
  financialReportsGenerated: number;
  errors: string[];
}

interface SubmissionStatus {
  totalCompanies: number;
  submittedCompanies: number;
  missingCompanies: number;
  missing: Array<{ companyId: string; name: string }>;
  canProceedWithDefaults: boolean;
}

interface CompilationWarning {
  canProceed: false;
  status: SubmissionStatus;
  message: string;
}

interface CompilationHistoryEntry {
  _id: Id<"compilations">;
  quarter: number;
  phase: "hiring" | "leadership";
  status: "pending" | "success" | "failed";
  startedAt: number;
  completedAt: number | null;
  companiesProcessed: number;
  errorMessage: string | null;
  compiledBy: { name: string; email: string } | null;
}

interface CompilationStatus {
  _id: Id<"compilations">;
  status: "pending" | "success" | "failed";
  startedAt: number;
  completedAt: number | null;
  companiesProcessed: number;
  errorMessage: string | null;
  compiledBy: { name: string; email: string } | null;
}

type CtxForAuth = ActionCtx | QueryCtx;

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
  handler: async (ctx, { gameId, quarter, proceedWithDefaults }): Promise<HiringCompilationResult | CompilationWarning> => {
    // Auth checks
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Check submission status (warn if incomplete)
    if (!proceedWithDefaults) {
      const status = await checkSubmissionStatusInline(ctx, gameId, quarter, "hiring");

      if (status.missingCompanies > 0) {
        return {
          canProceed: false,
          status,
          message: `${status.submittedCompanies}/${status.totalCompanies} companies submitted. Use proceedWithDefaults=true to compile anyway.`,
        };
      }
    }

    // Create compilation record
    const compilationId = await createCompilationRecordInline(ctx, gameId, quarter, "hiring", user._id);

    // Call internal compilation
    try {
      const result: HiringCompilationResult = await ctx.runAction(api.compilation.hiring._compileHiringDecisions, {
        gameId,
        quarter,
      });

      // Update compilation record with success
      await updateCompilationRecordInline(ctx, compilationId, "success", result.companiesProcessed || 0);

      return result;
    } catch (error: any) {
      // Update compilation record with failure
      await updateCompilationRecordInline(ctx, compilationId, "failed", 0, error.message);

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
  handler: async (ctx, { gameId, quarter, proceedWithDefaults }): Promise<LeadershipCompilationResult | CompilationWarning> => {
    // Auth checks
    const user = await requireAdminOrTeacher(ctx);
    await requireGameAccess(ctx, user, gameId);

    // Check submission status
    if (!proceedWithDefaults) {
      const status = await checkSubmissionStatusInline(ctx, gameId, quarter, "leadership");

      if (status.missingCompanies > 0) {
        return {
          canProceed: false,
          status,
          message: `${status.submittedCompanies}/${status.totalCompanies} companies submitted. Use proceedWithDefaults=true to compile anyway.`,
        };
      }
    }

    // Create compilation record
    const compilationId = await createCompilationRecordInline(ctx, gameId, quarter, "leadership", user._id);

    // Call internal compilation
    try {
      const result: LeadershipCompilationResult = await ctx.runAction(api.compilation.leadership._compileLeadershipDecisions, {
        gameId,
        quarter,
      });

      // Update compilation record with success
      await updateCompilationRecordInline(ctx, compilationId, "success", result.companiesProcessed || 0);

      return result;
    } catch (error: any) {
      // Update compilation record with failure
      await updateCompilationRecordInline(ctx, compilationId, "failed", 0, error.message);

      throw error;
    }
  },
});

/**
 * Helper: Require user has admin or teacher role
 */
async function requireAdminOrTeacher(ctx: CtxForAuth): Promise<User> {
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
  handler: async (ctx, { gameId }): Promise<CompilationHistoryEntry[]> => {
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
          completedAt: compilation.completedAt ?? null,
          companiesProcessed: compilation.companiesProcessed,
          errorMessage: compilation.errorMessage ?? null,
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
  handler: async (ctx, { gameId, quarter, phase }): Promise<CompilationStatus | null> => {
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
      completedAt: compilation.completedAt ?? null,
      companiesProcessed: compilation.companiesProcessed,
      errorMessage: compilation.errorMessage ?? null,
      compiledBy: compiledByUser
        ? { name: compiledByUser.name, email: compiledByUser.email }
        : null,
    };
  },
});

/**
 * Helper: Check teacher can access this game
 */
async function requireGameAccess(ctx: CtxForAuth, user: User, gameId: Id<"games">): Promise<void> {
  if (user.role === "admin") return; // Admins can access all games

  if (user.role === "teacher") {
    if (user.gameId !== gameId) {
      throw new Error(`Forbidden: You can only compile your assigned game`);
    }
  }
}

/**
 * Inline helper: Check submission status for a game/quarter/phase
 */
async function checkSubmissionStatusInline(
  ctx: ActionCtx,
  gameId: Id<"games">,
  quarter: number,
  phase: "hiring" | "leadership"
): Promise<SubmissionStatus> {
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
}

/**
 * Inline helper: Create a new compilation record
 */
async function createCompilationRecordInline(
  ctx: ActionCtx,
  gameId: Id<"games">,
  quarter: number,
  phase: "hiring" | "leadership",
  compiledBy: Id<"users">
): Promise<Id<"compilations">> {
  const compilationId = await ctx.runMutation(api.internal.mutations.createCompilationRecord, {
    gameId,
    quarter,
    phase,
    compiledBy,
  });

  return compilationId;
}

/**
 * Inline helper: Update a compilation record with results
 */
async function updateCompilationRecordInline(
  ctx: ActionCtx,
  compilationId: Id<"compilations">,
  status: "success" | "failed",
  companiesProcessed: number,
  errorMessage?: string
): Promise<void> {
  await ctx.runMutation(api.internal.mutations.updateCompilationRecord, {
    compilationId,
    status,
    companiesProcessed,
    errorMessage,
  });
}
