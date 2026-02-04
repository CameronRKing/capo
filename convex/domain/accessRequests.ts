/**
 * Access Request Domain Functions
 *
 * Handles the public access request workflow where users can request access
 * and admins can approve/deny those requests with game/company assignments.
 *
 * Workflow:
 * 1. Public users create access requests (name, email, role)
 * 2. Admins view pending requests
 * 3. Admins approve (assigning game/company) or deny requests
 * 4. Teachers: Select game (optional, can assign later)
 * 5. Students: Auto-select to least-populated company
 */

import { mutation, query, MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Public mutation: Create an access request
 *
 * Anyone can request access to the platform. The request will be in
 * "pending" status until an admin approves or denies it.
 *
 * @param name - User's full name
 * @param email - User's email address
 * @param role - Requested role (teacher or student)
 * @returns The ID of the created access request
 */
export const createAccessRequest = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
  },
  handler: async (ctx, { name, email, role }) => {
    // Check if a request already exists for this email
    const existingRequest = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        throw new Error(
          "An access request for this email is already pending approval."
        );
      } else if (existingRequest.status === "approved") {
        throw new Error(
          "This email has already been approved. Please log in."
        );
      } else {
        // Denied - allow creating a new request
        // Could also choose to update the existing request instead
      }
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new Error(
        "An account with this email already exists. Please log in."
      );
    }

    // Create the access request
    const requestId = await ctx.db.insert("accessRequests", {
      name,
      email,
      role,
      status: "pending",
      requestedGameId: undefined,
      requestedCompanyId: undefined,
    });

    return requestId;
  },
});

/**
 * Admin mutation: Approve an access request
 *
 * Approves a pending request and assigns the user to a game and optionally a company.
 * - Teachers: Assigned to a game (game selection is required)
 * - Students: Assigned to a game and the least-populated company in that game
 *
 * After approval, the user can sign in via magic link and will have access
 * to their assigned game/company.
 *
 * @param requestId - The ID of the access request to approve
 * @param gameId - The game to assign the user to (required for both teachers and students)
 * @param companyId - The company to assign the student to (optional for students, will auto-select if not provided)
 */
export const approveRequest = mutation({
  args: {
    requestId: v.id("accessRequests"),
    gameId: v.id("games"),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, { requestId, gameId, companyId }) => {
    // Get the request
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Access request not found");
    }

    if (request.status !== "pending") {
      throw new Error(
        `Cannot approve request with status "${request.status}"`
      );
    }

    // Verify the game exists
    const game = await ctx.db.get(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    // For students, determine company assignment
    let assignedCompanyId = companyId;

    if (request.role === "student") {
      // If no company specified, find the least-populated company in the game
      if (!assignedCompanyId) {
        assignedCompanyId = await findLeastPopulatedCompany(ctx, gameId);
      } else {
        // Verify the company belongs to the game
        const company = await ctx.db.get(assignedCompanyId);
        if (!company || company.gameId !== gameId) {
          throw new Error("Company does not belong to the specified game");
        }
      }
    }

    // Update the request status and assignments
    await ctx.db.patch(requestId, {
      status: "approved",
      requestedGameId: gameId,
      requestedCompanyId: assignedCompanyId,
    });

    return {
      requestId,
      gameId,
      companyId: assignedCompanyId,
    };
  },
});

/**
 * Admin mutation: Deny an access request
 *
 * Denies a pending access request. The request will be marked as "denied"
 * and the user will not be able to sign in.
 *
 * @param requestId - The ID of the access request to deny
 */
export const denyRequest = mutation({
  args: {
    requestId: v.id("accessRequests"),
  },
  handler: async (ctx, { requestId }) => {
    // Get the request
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new Error("Access request not found");
    }

    if (request.status !== "pending") {
      throw new Error(
        `Cannot deny request with status "${request.status}"`
      );
    }

    // Update the request status
    await ctx.db.patch(requestId, {
      status: "denied",
    });

    return { requestId };
  },
});

/**
 * Admin query: List all pending access requests
 *
 * Returns all access requests with "pending" status for admin review.
 * Results are ordered by creation time (newest first).
 *
 * @returns Array of pending access requests
 */
export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const pendingRequests = await ctx.db
      .query("accessRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Sort by creation time (newest first)
    pendingRequests.sort((a, b) => b._creationTime - a._creationTime);

    return pendingRequests;
  },
});

/**
 * Admin query: List all access requests (any status)
 *
 * Returns all access requests with optional status filtering.
 * Useful for audit trails and viewing request history.
 *
 * @param status - Optional status filter (pending, approved, denied)
 * @returns Array of access requests
 */
export const listAllRequests = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("denied"))
    ),
  },
  handler: async (ctx, { status }) => {
    if (status) {
      const requests = await ctx.db
        .query("accessRequests")
        .withIndex("by_status", (q) => q.eq("status", status))
        .collect();

      // Sort by creation time (newest first)
      requests.sort((a, b) => b._creationTime - a._creationTime);

      return requests;
    }

    // Get all requests
    const allRequests = await ctx.db.query("accessRequests").collect();

    // Sort by creation time (newest first)
    allRequests.sort((a, b) => b._creationTime - a._creationTime);

    return allRequests;
  },
});

/**
 * Query: List direct grant options for admins
 *
 * Returns all games and companies available for admin assignment when
 * approving access requests. This helps admins see what they can assign.
 *
 * @returns Object containing games and grouped companies
 */
export const listDirectGrantOptions = query({
  args: {},
  handler: async (ctx) => {
    // Get all games
    const games = await ctx.db
      .query("games")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "setup"),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // Get all companies
    const companies = await ctx.db.query("companies").collect();

    // Group companies by game
    const gamesWithCompanies = await Promise.all(
      games.map(async (game) => {
        const gameCompanies = companies.filter(
          (company) => company.gameId === game._id
        );

        // Count users per company
        const companiesWithCounts = await Promise.all(
          gameCompanies.map(async (company) => {
            const users = await ctx.db
              .query("users")
              .withIndex("by_company", (q) => q.eq("companyId", company._id))
              .collect();

            return {
              ...company,
              userCount: users.length,
            };
          })
        );

        return {
          ...game,
          companies: companiesWithCounts,
        };
      })
    );

    return {
      games: gamesWithCompanies,
    };
  },
});

/**
 * Helper function: Find the least-populated company in a game
 *
 * Queries all companies in the specified game and counts assigned users
 * to find the company with the fewest students. This is used for automatic
 * student assignment when approving access requests.
 *
 * @param ctx - The mutation context
 * @param gameId - The game to search within
 * @returns The ID of the least-populated company
 */
async function findLeastPopulatedCompany(
  ctx: MutationCtx,
  gameId: Id<"games">
): Promise<Id<"companies">> {
  // Get all companies in the game
  const companies = await ctx.db
    .query("companies")
    .withIndex("by_game", (q) => q.eq("gameId", gameId))
    .collect();

  if (companies.length === 0) {
    throw new Error("No companies found in this game");
  }

  // Count users for each company
  const companiesWithCounts = await Promise.all(
    companies.map(async (company) => {
      const users = await ctx.db
        .query("users")
        .withIndex("by_company", (q) => q.eq("companyId", company._id))
        .collect();

      return {
        companyId: company._id,
        userCount: users.length,
      };
    })
  );

  // Sort by user count (ascending) and return the first
  companiesWithCounts.sort((a, b) => a.userCount - b.userCount);

  return companiesWithCounts[0].companyId;
}

/**
 * Public query: Check if an email has a pending or approved request
 *
 * Allows users to check their access request status before attempting to sign in.
 *
 * @param email - The email to check
 * @returns The access request if found, null otherwise
 */
export const checkRequestStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const request = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (!request) {
      return null;
    }

    return {
      status: request.status,
      role: request.role,
      name: request.name,
    };
  },
});
