/**
 * Access Request Functions
 *
 * Provides mutations and queries for managing user access requests.
 * Integrates with the auth workflow to enforce the approval-based access control.
 *
 * Flow:
 * 1. User submits request via create mutation → status: "pending"
 * 2. Admin views pending requests via listPending query
 * 3. Admin approves/denies via approve/deny mutations
 * 4. User signs in via magic link → auth callback checks for approved request
 * 5. If approved, user account is created with role/gameId/companyId
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new access request
 *
 * Validates that:
 * - Email doesn't have a pending request
 * - User doesn't already exist
 *
 * @throws Error if email already has pending request
 * @throws Error if user already exists
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { name, email, role }) => {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existingUser) {
      throw new Error(
        "An account with this email already exists. Please sign in."
      );
    }

    // Check for pending request
    const pendingRequest = await ctx.db
      .query("accessRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();

    if (pendingRequest) {
      throw new Error(
        "You already have a pending access request. Please wait for approval."
      );
    }

    // Check for approved/denied requests
    const existingRequest = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .first();

    if (existingRequest) {
      if (existingRequest.status === "approved") {
        throw new Error(
          "Your access has been approved! Please sign in with your email."
        );
      }
      if (existingRequest.status === "denied") {
        throw new Error(
          "Your access request was denied. Please contact your administrator."
        );
      }
    }

    // Create pending access request
    const requestId = await ctx.db.insert("accessRequests", {
      name: name.trim(),
      email: normalizedEmail,
      role,
      status: "pending",
      requestedGameId: undefined,
      requestedCompanyId: undefined,
    });

    console.log(`Access request created: ${requestId} for ${normalizedEmail} (${role})`);

    return requestId;
  },
});

/**
 * List all pending access requests
 *
 * Used by admin to view requests that need approval
 */
export const listPending = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("accessRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return requests;
  },
});

/**
 * Approve an access request
 *
 * Admin can optionally assign:
 * - gameId: For teachers (which game they manage)
 * - companyId: For students (which company they're on)
 *
 * @throws Error if request not found
 * @throws Error if request already processed
 */
export const approve = mutation({
  args: {
    requestId: v.id("accessRequests"),
    gameId: v.optional(v.id("games")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, { requestId, gameId, companyId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Access request not found");
    }

    if (request.status !== "pending") {
      throw new Error(
        `Request already ${request.status}. Cannot approve.`
      );
    }

    // Update request to approved with assignments
    await ctx.db.patch(requestId, {
      status: "approved",
      requestedGameId: gameId,
      requestedCompanyId: companyId,
    });

    console.log(
      `Access request approved: ${requestId} for ${request.email} (${request.role})`
    );

    return { success: true };
  },
});

/**
 * Deny an access request
 *
 * @throws Error if request not found
 * @throws Error if request already processed
 */
export const deny = mutation({
  args: {
    requestId: v.id("accessRequests"),
  },
  handler: async (ctx, { requestId }) => {
    const request = await ctx.db.get(requestId);

    if (!request) {
      throw new Error("Access request not found");
    }

    if (request.status !== "pending") {
      throw new Error(
        `Request already ${request.status}. Cannot deny.`
      );
    }

    await ctx.db.patch(requestId, {
      status: "denied",
    });

    console.log(`Access request denied: ${requestId} for ${request.email}`);

    return { success: true };
  },
});

/**
 * List all games
 *
 * Used in admin access panel to select game for teacher assignment
 */
export const listGames = query({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db
      .query("games")
      .collect();

    return games;
  },
});

/**
 * List companies by game
 *
 * Used in admin access panel to select company for student assignment
 */
export const listCompanies = query({
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
