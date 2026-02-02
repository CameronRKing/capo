/**
 * Presence Service - Real-time user presence tracking for company rooms
 *
 * Integrates with @convex-dev/presence to provide:
 * - Company-room-based presence (each company is a room)
 * - Heartbeat-based session management
 * - Online/offline status tracking
 * - Multi-user session support
 *
 * Room Token Format: "company:<companyId>" where companyId is stringified Convex ID
 *
 * @see https://www.convex.dev/components/presence
 */

import { mutation, query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import { Presence } from "@convex-dev/presence";
import { getCurrentUser } from "./permissions";

/**
 * Presence instance configured with @convex-dev/presence component
 */
const presence = new Presence(components.presence);

/**
 * Construct a room token for a company
 *
 * @param companyId - The Convex ID of the company
 * @returns Room token in format "company:<companyId>"
 *
 * @example
 * ```ts
 * const roomToken = getRoomToken("company123"); // "company:company123"
 * ```
 */
export function getRoomToken(companyId: string): string {
  return `company:${companyId}`;
}

/**
 * Heartbeat mutation - Updates user's presence in a company room
 *
 * Called periodically (every 10 seconds) by clients to maintain online status.
 * Creates or refreshes user session, returning session token for disconnect operations.
 *
 * **Authentication**: Required. User must be authenticated via ctx.auth.
 *
 * @param roomId - Room token (use getRoomToken() to construct)
 * @param userId - User's Convex ID (extracted from auth, passed for validation)
 * @param sessionId - Client-generated UUID for this session
 * @param interval - Heartbeat interval in milliseconds (recommended: 10000)
 * @returns Session token for disconnect mutations
 *
 * @example
 * ```ts
 * // Client-side usage
 * const sessionId = crypto.randomUUID();
 * const sessionToken = await heartbeat({
 *   roomId: getRoomToken(user.companyId),
 *   userId: user._id,
 *   sessionId,
 *   interval: 10000,
 * });
 * ```
 */
export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.id("users"),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    // Verify user is authenticated and matches the provided userId
    const currentUser = await getCurrentUser(ctx);
    if (currentUser._id !== userId) {
      throw new Error("User ID does not match authenticated user");
    }

    // Ensure user can only join presence for their assigned company
    if (!roomId.startsWith("company:")) {
      throw new Error("Invalid room format. Expected 'company:<companyId>'");
    }

    const companyId = roomId.split(":")[1];
    if (currentUser.role === "student" && currentUser.companyId !== companyId) {
      throw new Error("Student can only join presence for their assigned company");
    }

    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

/**
 * List query - Returns all users currently present in a room
 *
 * Provides real-time reactive list of online users for avatar display.
 * Updates automatically when users join/leave or sessions expire.
 *
 * **Authentication**: Required. Users can only query their company's presence.
 *
 * @param roomToken - Room token to query (format: "company:<companyId>")
 * @returns Array of presence entries with user data
 *
 * @example
 * ```ts
 * // Client-side usage
 * const onlineUsers = useQuery(api.services.presence.list, {
 *   roomToken: getRoomToken(user.companyId)
 * });
 *
 * // Display avatars
 * <FacePile presenceState={onlineUsers ?? []} />
 * ```
 */
export const list = query({
  args: {
    roomToken: v.string(),
  },
  handler: async (ctx, { roomToken }) => {
    // Verify authentication
    const user = await getCurrentUser(ctx);

    // Validate room format and access
    if (!roomToken.startsWith("company:")) {
      throw new Error("Invalid room format. Expected 'company:<companyId>'");
    }

    const companyId = roomToken.split(":")[1];

    // Students can only query their own company's presence
    if (user.role === "student" && user.companyId !== companyId) {
      return []; // Return empty array instead of error for cleaner UX
    }

    return await presence.list(ctx, roomToken);
  },
});

/**
 * Disconnect mutation - Removes user session from presence
 *
 * Called when user explicitly leaves or logs out. Immediately removes session
 * from presence list (no timeout delay).
 *
 * **Authentication**: Required.
 *
 * @param sessionToken - Session token returned from heartbeat mutation
 *
 * @example
 * ```ts
 * // Client-side usage on logout or page unload
 * await disconnect({ sessionToken });
 * ```
 */
export const disconnect = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, { sessionToken }) => {
    // Verify authentication (optional but recommended for audit)
    await getCurrentUser(ctx);

    return await presence.disconnect(ctx, sessionToken);
  },
});
