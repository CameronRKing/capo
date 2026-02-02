/**
 * Games Domain Service
 *
 * Game state and phase progression queries.
 * Provides access to current game phase and submission status.
 */

import { queryWithRLS, mutationWithRLS } from "../services/rowLevelSecurity";
import { v } from "convex/values";

/**
 * Query: Get game by ID
 *
 * Fetches a game with its current state (quarter, phase, status).
 * Uses RLS to ensure only authorized users can access the game.
 *
 * Access Control (via RLS):
 * - Admins: Can read any game
 * - Teachers: Can read their assigned game
 * - Students: Can read their assigned game
 *
 * @param gameId - The ID of the game to fetch
 * @returns The game object with currentQuarter, currentPhase, status, etc.
 */
export const getGame = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    return game;
  },
});

/**
 * Query: Get current phase info
 *
 * Returns the current quarter and phase for a game.
 * Convenience function that extracts phase info from the game object.
 *
 * @param gameId - The ID of the game
 * @returns Object with quarter (number) and phase ("hiring" | "leadership")
 */
export const getCurrentPhase = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);

    if (!game) {
      return null;
    }

    return {
      quarter: game.currentQuarter,
      phase: game.currentPhase,
    };
  },
});

/**
 * Query: Get phase submission status
 *
 * Checks whether the current company has submitted decisions for the current phase.
 * Returns submission details including who submitted and when.
 *
 * Logic:
 * 1. Fetch the game to determine current phase
 * 2. Check the appropriate decision table (hiringDecisions or leadershipDecisions)
 * 3. Return submission status for the current company and quarter
 *
 * @param gameId - The ID of the game
 * @param companyId - The ID of the company to check
 * @returns Submission status object or null if no decision exists yet
 */
export const getPhaseStatus = queryWithRLS({
  args: {
    gameId: v.id("games"),
    companyId: v.id("companies"),
  },
  handler: async (ctx, { gameId, companyId }) => {
    // Get the game to determine current phase and quarter
    const game = await ctx.db.get(gameId);

    if (!game) {
      return null;
    }

    const { currentQuarter, currentPhase } = game;

    // Check the appropriate decision table based on current phase
    if (currentPhase === "hiring") {
      const decision = await ctx.db
        .query("hiringDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", currentQuarter)
        )
        .first();

      if (!decision) {
        return {
          isSubmitted: false,
          submittedBy: undefined,
          submittedAt: undefined,
        };
      }

      return {
        isSubmitted: decision.isSubmitted,
        submittedBy: decision.submittedBy,
        submittedAt: decision.submittedAt,
      };
    } else if (currentPhase === "leadership") {
      const decision = await ctx.db
        .query("leadershipDecisions")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", currentQuarter)
        )
        .first();

      if (!decision) {
        return {
          isSubmitted: false,
          submittedBy: undefined,
          submittedAt: undefined,
        };
      }

      return {
        isSubmitted: decision.isSubmitted,
        submittedBy: decision.submittedBy,
        submittedAt: decision.submittedAt,
      };
    }

    return null;
  },
});

/**
 * Mutation: Create a new game
 *
 * Creates a new game with the specified parameters.
 * Used primarily for testing purposes.
 */
export const create = mutationWithRLS({
  args: {
    name: v.string(),
    length: v.number(),
    currentQuarter: v.number(),
    currentPhase: v.union(v.literal("hiring"), v.literal("leadership")),
    status: v.union(v.literal("setup"), v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const gameId = await ctx.db.insert("games", args);
    return gameId;
  },
});
