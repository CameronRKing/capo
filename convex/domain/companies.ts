/**
 * Companies Domain Module
 *
 * Functions for managing companies within games.
 */

import { v } from "convex/values";
import { queryWithRLS, mutationWithRLS } from "../services/rowLevelSecurity";

/**
 * Query: Get company by ID
 */
export const get = queryWithRLS({
  args: {
    id: v.id("companies"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/**
 * Query: List companies in a game
 */
export const listByGame = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    return companies;
  },
});

/**
 * Mutation: Create a new company
 *
 * Creates a new company in the specified game/industry.
 * Used primarily for testing.
 */
export const create = mutationWithRLS({
  args: {
    gameId: v.id("games"),
    industry: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const companyId = await ctx.db.insert("companies", args);
    return companyId;
  },
});
