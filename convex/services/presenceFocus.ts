/**
 * Presence Focus Service - Real-time input focus tracking
 *
 * Tracks which users are currently focused on which input fields,
 * supporting multiple users focused on the same field simultaneously.
 *
 * Field ID Format: "<companyId>:<entity>:<fieldPath>"
 * Examples:
 * - "company123:hiring:salary" - Salary field in hiring decision
 * - "company123:leadership:timeRecruiting" - Time recruiting in leadership decision
 *
 * Integrates with presence service to show real-time collaboration indicators.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./permissions";
import { Id } from "../_generated/dataModel";

/**
 * Construct a field ID for focus tracking
 *
 * @param companyId - The Convex ID of the company
 * @param entity - The entity type (e.g., "hiring", "leadership", "rankings")
 * @param fieldPath - The field path (e.g., "salary", "timeRecruiting")
 * @returns Field ID in format "companyId:entity:fieldPath"
 *
 * @example
 * ```ts
 * const fieldId = getFieldId("company123", "hiring", "salary");
 * // Returns: "company123:hiring:salary"
 * ```
 */
export function getFieldId(
  companyId: string,
  entity: string,
  fieldPath: string
): string {
  return `${companyId}:${entity}:${fieldPath}`;
}

/**
 * Parse a field ID into its components
 *
 * @param fieldId - The field ID to parse
 * @returns Object with companyId, entity, and fieldPath
 *
 * @example
 * ```ts
 * const parts = parseFieldId("company123:hiring:salary");
 * // Returns: { companyId: "company123", entity: "hiring", fieldPath: "salary" }
 * ```
 */
export function parseFieldId(fieldId: string): {
  companyId: string;
  entity: string;
  fieldPath: string;
} {
  const [companyId, entity, ...fieldPathParts] = fieldId.split(":");
  return {
    companyId,
    entity,
    fieldPath: fieldPathParts.join(":"),
  };
}

/**
 * Update focus mutation - Records or updates user focus on a field
 *
 * Creates or updates a focus record for the user-field combination.
 * Overwrites any previous focus for the same user on different fields.
 *
 * **Authentication**: Required.
 *
 * @param fieldId - The field ID to focus on (use getFieldId() to construct)
 * @param userId - User's Convex ID (extracted from auth)
 *
 * @example
 * ```ts
 * // Client-side usage on input focus
 * await updateFocus({
 *   fieldId: getFieldId(user.companyId, "hiring", "salary")
 * });
 * ```
 */
export const updateFocus = mutation({
  args: {
    fieldId: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { fieldId, userId }) => {
    // Verify authentication and user matches
    const currentUser = await getCurrentUser(ctx);
    if (currentUser._id !== userId) {
      throw new Error("User ID does not match authenticated user");
    }

    // Validate field ID format
    const parts = fieldId.split(":");
    if (parts.length < 3) {
      throw new Error(
        'Invalid fieldId format. Expected "companyId:entity:fieldPath"'
      );
    }

    const companyId = parts[0];

    // Students can only focus fields in their company
    if (currentUser.role === "student" && currentUser.companyId !== companyId) {
      throw new Error("Student can only focus fields in their assigned company");
    }

    // Remove any existing focus for this user (they can only focus one field at a time)
    const existingFocus = await ctx.db
      .query("presenceFocus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingFocus) {
      await ctx.db.delete(existingFocus._id);
    }

    // Create new focus record
    await ctx.db.insert("presenceFocus", {
      fieldId,
      userId,
      timestamp: Date.now(),
    });
  },
});

/**
 * Clear focus mutation - Removes user focus when blurring input
 *
 * Removes the focus record for the current user, indicating they are no
 * longer focused on any field.
 *
 * **Authentication**: Required.
 *
 * @param userId - User's Convex ID (extracted from auth)
 *
 * @example
 * ```ts
 * // Client-side usage on input blur
 * await clearFocus({ userId: user._id });
 * ```
 */
export const clearFocus = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, { userId }) => {
    // Verify authentication and user matches
    const currentUser = await getCurrentUser(ctx);
    if (currentUser._id !== userId) {
      throw new Error("User ID does not match authenticated user");
    }

    // Find and remove focus record for this user
    const existingFocus = await ctx.db
      .query("presenceFocus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingFocus) {
      await ctx.db.delete(existingFocus._id);
    }
  },
});

/**
 * Get focus by field query - Returns all users focused on a specific field
 *
 * Provides real-time reactive list of users currently focused on a field.
 * Used for displaying avatars and multi-user indicators.
 *
 * **Authentication**: Required. Users can only query focus for their company.
 *
 * @param fieldId - The field ID to query
 * @returns Array of objects with user info and focus timestamp
 *
 * @example
 * ```ts
 * // Client-side usage
 * const focusedUsers = useQuery(api.services.presenceFocus.getFocusByField, {
 *   fieldId: getFieldId(user.companyId, "hiring", "salary")
 * });
 *
 * // Display avatars of users focused on this field
 * <FacePile presenceState={focusedUsers ?? []} />
 * ```
 */
export const getFocusByField = query({
  args: {
    fieldId: v.string(),
  },
  handler: async (ctx, { fieldId }) => {
    const user = await getCurrentUser(ctx);

    // Validate field ID format
    const parts = fieldId.split(":");
    if (parts.length < 3) {
      throw new Error("Invalid fieldId format");
    }

    const companyId = parts[0];

    // Students can only query focus for their company
    if (user.role === "student" && user.companyId !== companyId) {
      return [];
    }

    // Query all focus records for this field
    const focusRecords = await ctx.db
      .query("presenceFocus")
      .withIndex("by_field", (q) => q.eq("fieldId", fieldId))
      .collect();

    // Fetch user data for each focus record
    const result = await Promise.all(
      focusRecords.map(async (focus) => {
        const focusedUser = await ctx.db.get(focus.userId);
        if (!focusedUser) return null;

        return {
          user: {
            _id: focusedUser._id,
            name: focusedUser.name,
            email: focusedUser.email,
          },
          timestamp: focus.timestamp,
        };
      })
    );

    // Filter out nulls and sort by timestamp (most recent first)
    return result
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.timestamp - a.timestamp);
  },
});

/**
 * Get focus by user query - Returns all fields the user is currently focused on
 *
 * Used internally for cleanup and state management.
 *
 * **Authentication**: Required. Users can only query their own focus.
 *
 * @param userId - The user ID to query (defaults to authenticated user)
 * @returns Array of field IDs the user is focused on
 *
 * @example
 * ```ts
 * // Client-side usage
 * const myFocus = useQuery(api.services.presenceFocus.getFocusByUser);
 * // Returns: ["company123:hiring:salary", "company123:hiring:commission"]
 * ```
 */
export const getFocusByUser = query({
  args: {
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, { userId }) => {
    const currentUser = await getCurrentUser(ctx);

    // If userId not provided, use authenticated user
    const targetUserId = userId ?? currentUser._id;

    // Users can only query their own focus unless they're admin/teacher
    if (
      currentUser.role === "student" &&
      targetUserId !== currentUser._id
    ) {
      return [];
    }

    // Query all focus records for this user
    const focusRecords = await ctx.db
      .query("presenceFocus")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .collect();

    return focusRecords.map((focus) => focus.fieldId);
  },
});

/**
 * Last Edited Tracking
 *
 * Tracks "last edited by user at time" metadata for fields.
 * This is separate from real-time focus and provides historical context.
 */

/**
 * Update last edited mutation - Records that a user modified a field
 *
 * Stores last edited metadata. For MVP, this is stored in the decision
 * documents themselves as a "lastEdited" object. Future enhancement could
 * move to separate table for better queryability.
 *
 * **Authentication**: Required.
 *
 * @param fieldId - The field ID that was edited
 * @param companyId - The company ID (for authorization)
 *
 * @example
 * ```ts
 * // Call this when user blurs a field they modified
 * await updateLastEdited({
 *   fieldId: getFieldId(user.companyId, "hiring", "salary"),
 *   companyId: user.companyId
 * });
 * ```
 */
export const updateLastEdited = mutation({
  args: {
    fieldId: v.string(),
    companyId: v.id("companies"),
  },
  handler: async (ctx, { fieldId, companyId }) => {
    const user = await getCurrentUser(ctx);

    // Validate company access
    if (user.role === "student" && user.companyId !== companyId) {
      throw new Error("Student can only edit fields in their assigned company");
    }

    // For MVP: Last edited is stored in decision documents
    // This mutation is a placeholder for the integration pattern
    // Actual implementation will be in domain/decisions services
    // where decision documents have a "lastEdited" field

    // Parse field ID to determine which decision document to update
    const parts = parseFieldId(fieldId);
    const timestamp = Date.now();

    // Return the metadata for the caller to use
    return {
      userId: user._id,
      userName: user.name,
      timestamp,
      formatted: `Last edited by ${user.name} at ${new Date(timestamp).toLocaleTimeString()}`,
    };
  },
});

/**
 * Get last edited query - Returns last edited metadata for a field
 *
 * For MVP, this queries the decision document's lastEdited field.
 * Future enhancement could use a separate lastEdited table.
 *
 * **Authentication**: Required.
 *
 * @param fieldId - The field ID to query
 * @returns Last edited metadata or null if never edited
 *
 * @example
 * ```ts
 * // Client-side usage
 * const lastEdited = useQuery(api.services.presenceFocus.getLastEdited, {
 *   fieldId: getFieldId(user.companyId, "hiring", "salary")
 * });
 *
 * // Display below input
 * <p className="text-xs text-gray-500">{lastEdited?.formatted ?? "Not yet edited"}</p>
 * ```
 */
export const getLastEdited = query({
  args: {
    fieldId: v.string(),
  },
  handler: async (ctx, { fieldId }) => {
    const user = await getCurrentUser(ctx);

    // Parse field ID
    const parts = parseFieldId(fieldId);

    // For MVP: Return placeholder - actual implementation in domain services
    // This query is here to define the API contract
    return null;
  },
});
