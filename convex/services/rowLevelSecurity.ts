/**
 * Row-Level Security (RLS) Framework
 *
 * Provides automatic database-level access control using convex-helpers.
 * Enforces role-based filtering on all queries and mutations with defense-in-depth security.
 *
 * Usage:
 * - Use queryWithRLS instead of standard query for automatic read filtering
 * - Use mutationWithRLS instead of standard mutation for automatic write enforcement
 * - Access ctx.user in handlers for business logic decisions
 */

import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { Rules, wrapDatabaseReader, wrapDatabaseWriter } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "../_generated/dataModel";
import { mutation, query, QueryCtx } from "../_generated/server";
import { User, getCurrentUser } from "./permissions";

/**
 * Define RLS rules for the business simulation
 * Rules are evaluated per-document for all database operations
 *
 * Access patterns:
 * - Admins: Full platform access
 * - Teachers: Game-level access (all companies in their assigned game)
 * - Students: Company-level access (only their assigned company)
 */
async function rlsRules(ctx: QueryCtx, user: User): Promise<Rules<QueryCtx, DataModel>> {
  return {
    // Games table
    games: {
      read: async (ctx, game) => {
        // Admins can read all games
        if (user.role === "admin") return true;
        // Teachers can read their assigned game
        if (user.role === "teacher" && user.gameId === game._id) return true;
        // Students can read their game
        if (user.role === "student" && user.gameId === game._id) return true;
        return false;
      },
      insert: async () => user.role === "admin", // Only admins can create games
      modify: async (ctx, game) => {
        // Admins can modify all games
        if (user.role === "admin") return true;
        // Teachers can modify their game (e.g., update current quarter)
        if (user.role === "teacher" && user.gameId === game._id) return true;
        return false;
      },
    },

    // Companies table
    companies: {
      read: async (ctx, company) => {
        // Admins read all companies
        if (user.role === "admin") return true;
        // Teachers read all companies in their game
        if (user.role === "teacher" && user.gameId === company.gameId) return true;
        // Students read only their company
        if (user.role === "student" && user.companyId === company._id) return true;
        return false;
      },
      insert: async () => user.role === "admin" || user.role === "teacher",
      modify: async (ctx, company) => {
        // Students can modify their company (decisions)
        if (user.role === "student" && user.companyId === company._id) return true;
        // Admins and teachers can modify companies
        return user.role === "admin" || (user.role === "teacher" && user.gameId === company.gameId);
      },
    },

    // Hiring decisions
    hiringDecisions: {
      read: async (ctx, decision) => {
        if (user.role === "admin") return true;
        // Teachers read decisions for all their game's companies
        if (user.role === "teacher") {
          const company = await ctx.db.get(decision.companyId);
          return company?.gameId === user.gameId;
        }
        // Students read only their company's decisions
        return user.companyId === decision.companyId;
      },
      insert: async (ctx, decision) => {
        // Students can create decisions for their company
        if (user.role === "student") return decision.companyId === user.companyId;
        // Admins and teachers can create decisions
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, decision) => {
        // Students can modify their company's decisions
        if (user.role === "student" && decision.companyId === user.companyId) return true;
        // Teachers can read but not modify student decisions
        if (user.role === "teacher") return false;
        // Admins can modify all decisions
        return user.role === "admin";
      },
    },

    // Leadership decisions (same pattern)
    leadershipDecisions: {
      read: async (ctx, decision) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(decision.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === decision.companyId;
      },
      insert: async (ctx, decision) => {
        if (user.role === "student") return decision.companyId === user.companyId;
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, decision) => {
        if (user.role === "student" && decision.companyId === user.companyId) return true;
        if (user.role === "teacher") return false;
        return user.role === "admin";
      },
    },

    // Reports (read-only for students)
    repPerformanceReports: {
      read: async (ctx, report) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(report.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === report.companyId;
      },
      insert: async () => user.role === "admin" || user.role === "teacher",
      modify: async () => false, // Reports are immutable after generation
    },

    financialReports: {
      read: async (ctx, report) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(report.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === report.companyId;
      },
      insert: async () => user.role === "admin" || user.role === "teacher",
      modify: async () => false,
    },

    hiringOutcomeReports: {
      read: async (ctx, report) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(report.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === report.companyId;
      },
      insert: async () => user.role === "admin" || user.role === "teacher",
      modify: async () => false,
    },

    // Active reps
    activeReps: {
      read: async (ctx, rep) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(rep.companyId);
          return company?.gameId === user.gameId;
        }
        return rep.companyId === user.companyId;
      },
      insert: async (ctx, rep) => {
        // Students can add reps to their company
        if (user.role === "student") return rep.companyId === user.companyId;
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, rep) => {
        // Students can modify their company's reps
        if (user.role === "student" && rep.companyId === user.companyId) return true;
        if (user.role === "teacher") return false;
        return user.role === "admin";
      },
    },

    // Resume rankings (student-specific data)
    // Students can READ their own rankings AND teammates' rankings (private but visible)
    // Students can only MODIFY their own rankings
    resumeRankings: {
      read: async (ctx, ranking) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(ranking.companyId);
          return company?.gameId === user.gameId;
        }
        // Students read their own rankings AND teammates' rankings
        // This enables real-time collaboration - students see but cannot edit teammates' work
        if (user.role === "student") {
          return ranking.userId === user._id || ranking.companyId === user.companyId;
        }
        return false;
      },
      insert: async (ctx, ranking) => {
        // Students create rankings for themselves
        if (user.role === "student") return ranking.userId === user._id;
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, ranking) => {
        // Students can only modify their OWN rankings (not teammates')
        // This enforces private-but-visible: see others' work, can't change it
        if (user.role === "student" && ranking.userId === user._id) return true;
        if (user.role === "teacher") return false;
        return user.role === "admin";
      },
    },

    // Hiring lists (company-level aggregated rankings)
    hiringLists: {
      read: async (ctx, list) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(list.companyId);
          return company?.gameId === user.gameId;
        }
        return list.companyId === user.companyId;
      },
      insert: async () => user.role === "admin" || user.role === "teacher",
      modify: async (ctx, list) => {
        // Students can modify their company's hiring list
        if (user.role === "student" && list.companyId === user.companyId) return true;
        if (user.role === "teacher") return false;
        return user.role === "admin";
      },
    },

    // Users table (admins and self-access)
    users: {
      read: async (ctx, targetUser) => {
        // Admins read all users
        if (user.role === "admin") return true;
        // Teachers read users in their game
        if (user.role === "teacher" && targetUser.gameId === user.gameId) return true;
        // Students read themselves and teammates
        if (user.role === "student") {
          return targetUser._id === user._id || targetUser.companyId === user.companyId;
        }
        return false;
      },
      insert: async () => user.role === "admin", // Only admins create users directly
      modify: async (ctx, targetUser) => {
        // Users can modify their own profile
        if (targetUser._id === user._id) return true;
        // Admins can modify any user
        return user.role === "admin";
      },
    },

    // Access requests
    accessRequests: {
      read: async (ctx, request) => {
        // Admins read all requests
        if (user.role === "admin") return true;
        // Teachers read requests for their game
        if (user.role === "teacher" && request.requestedGameId === user.gameId) return true;
        // Students read their own requests
        if (user.role === "student") return request.email === user.email;
        return false;
      },
      insert: async () => true, // Anyone can create an access request
      modify: async () => user.role === "admin", // Only admins can approve/deny
    },

    // Static data tables (publicly readable, admin-only writable)
    resumes: {
      read: async () => true, // All authenticated users can read resumes
      insert: async () => user.role === "admin",
      modify: async () => user.role === "admin",
    },

    counties: {
      read: async () => true, // All authenticated users can read counties
      insert: async () => user.role === "admin",
      modify: async () => user.role === "admin",
    },
  };
}

/**
 * Custom query builder with automatic RLS enforcement
 *
 * Use this instead of the standard `query` for automatic access control.
 * The database client (ctx.db) is wrapped with RLS rules that filter results.
 *
 * @example
 * export const getMyDecisions = queryWithRLS({
 *   args: { quarter: v.number() },
 *   handler: async (ctx, { quarter }) => {
 *     // ctx.db is wrapped - RLS rules automatically filter results
 *     // ctx.user is available for business logic
 *     const decisions = await ctx.db
 *       .query("hiringDecisions")
 *       .withIndex("by_company_quarter", q =>
 *         q.eq("companyId", ctx.user.companyId).eq("quarter", quarter)
 *       )
 *       .collect();
 *
 *     // If student: only sees their company's decisions
 *     // If teacher: only sees decisions from companies in their game
 *     // If admin: sees all decisions
 *     return decisions;
 *   },
 * });
 */
export const queryWithRLS = customQuery(query, customCtx(async (ctx) => {
  const user = await getCurrentUser(ctx);
  return {
    db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx, user), {
      defaultPolicy: "deny", // Deny access by default, only allow if rule returns true
    }),
    user,
  };
}));

/**
 * Custom mutation builder with automatic RLS enforcement
 *
 * Use this instead of the standard `mutation` for automatic access control.
 * The database client (ctx.db) is wrapped with RLS rules that enforce writes.
 *
 * @example
 * export const updateMyDecisions = mutationWithRLS({
 *   args: { decisions: hiringDecisionsSchema },
 *   handler: async (ctx, { decisions }) => {
 *     // ctx.db is wrapped - RLS rules automatically enforce access
 *     // Students can only modify their company's decisions
 *     // Teachers cannot modify student decisions
 *     // Admins can modify everything
 *     await ctx.db.patch(decisionId, decisions);
 *   },
 * });
 */
export const mutationWithRLS = customMutation(mutation, customCtx(async (ctx) => {
  const user = await getCurrentUser(ctx);
  return {
    db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx, user), {
      defaultPolicy: "deny",
    }),
    user,
  };
}));
