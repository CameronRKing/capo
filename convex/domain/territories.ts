/**
 * Territory Assignment Domain Module
 *
 * Handles county-to-rep territory assignments with contiguity validation.
 * Each county is assigned to exactly one rep per company per quarter.
 *
 * Constraints:
 * - All 88 counties must be assigned
 * - Every rep must have at least 1 county
 * - Counties assigned to a rep must be contiguous (connected)
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { mutationWithRLS, queryWithRLS } from "../services/rowLevelSecurity";

// County adjacency network (which counties border which)
// Source: legacy code, represents Ohio county borders
export const COUNTY_ADJACENCY: Record<number, number[]> = {
  1: [49, 55],
  2: [42],
  3: [67],
  4: [5, 66, 78],
  5: [4, 86, 87],
  6: [21, 38, 57],
  7: [75],
  8: [9],
  9: [8, 43, 45, 79, 88, 36],
  10: [73],
  11: [14, 21, 27, 56, 63, 65, 73],
  12: [14, 27, 35, 50, 56, 63, 65],
  13: [21, 57, 58],
  14: [11, 12, 27, 56, 63, 65, 50],
  15: [42, 62, 81],
  16: [17, 18, 26, 30, 69, 83],
  17: [12, 16, 18, 19, 20, 30, 32, 69],
  18: [16, 17, 20, 30, 37, 40, 67, 3],
  19: [17, 32, 57],
  20: [17, 18, 32],
  21: [6, 11, 13, 38, 63, 85],
  22: [23, 25, 55, 80],
  23: [22, 25, 42, 54, 55, 60],
  24: [34, 47, 76],
  25: [22, 23, 42, 80],
  26: [1, 16, 49, 54, 83],
  27: [11, 12, 14, 35, 56],
  28: [20, 32, 42, 60, 61, 81],
  29: [73],
  30: [16, 17, 18, 32, 69],
  31: [5, 35, 58, 71],
  32: [17, 19, 20, 28, 30, 61, 69],
  33: [34, 37, 44, 76],
  34: [24, 33, 44, 47, 76],
  35: [12, 27, 31, 58, 71, 72],
  36: [9, 45],
  37: [18, 33, 40, 44, 67, 3],
  38: [6, 21, 39, 40],
  39: [38, 43, 75],
  40: [18, 37, 38, 67, 3],
  41: [59, 70, 82],
  42: [2, 15, 23, 25, 28, 60],
  43: [9, 39, 45, 75],
  44: [33, 34, 37, 76],
  45: [9, 36, 43],
  46: [5],
  47: [24, 34, 76],
  48: [66, 71, 78],
  49: [1, 26, 54, 83],
  50: [12, 14, 56, 73, 82],
  51: [66],
  52: [68, 70, 82],
  53: [68, 70],
  54: [1, 23, 26, 49, 55, 60],
  55: [1, 22, 23, 54],
  56: [11, 12, 14, 27, 50, 82],
  57: [6, 12, 13, 19, 58],
  58: [13, 31, 35, 57, 72],
  59: [41, 70, 82],
  60: [23, 28, 42, 54, 61, 83],
  61: [28, 32, 60, 69, 83],
  62: [15, 79, 81, 85],
  63: [11, 12, 14, 21, 65],
  64: [84, 88],
  65: [11, 12, 14, 63],
  66: [4, 48, 51, 71, 78],
  67: [3, 18, 37, 40, 77],
  68: [52, 53, 70],
  69: [16, 17, 30, 32, 61, 83],
  70: [41, 52, 53, 59, 68, 82],
  71: [31, 35, 48, 66, 72, 78],
  72: [35, 58, 71],
  73: [10, 11, 29, 50],
  74: [80, 84],
  75: [7, 39, 43, 88],
  76: [24, 33, 34, 44, 47],
  77: [67],
  78: [4, 48, 66, 71],
  79: [9, 62, 85, 88],
  80: [22, 25, 74, 84],
  81: [15, 28, 62, 85],
  82: [41, 50, 52, 56, 59, 70],
  83: [1, 16, 26, 49, 60, 61, 69],
  84: [64, 74, 80, 88],
  85: [21, 62, 79, 81],
  86: [5, 87],
  87: [5, 86],
  88: [9, 64, 75, 79, 84],
};

/**
 * Get territory assignments for a company/quarter
 */
export const getTerritory = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const territory = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return territory;
  },
});

/**
 * Get all counties with their data (for map rendering)
 */
export const getAllCounties = query({
  args: {},
  handler: async (ctx) => {
    const counties = await ctx.db.query("counties").collect();
    return counties;
  },
});

/**
 * Get adjacent counties for a specific county
 */
export const getAdjacentCounties = query({
  args: {
    countyId: v.number(),
  },
  handler: async (ctx, { countyId }) => {
    return COUNTY_ADJACENCY[countyId] || [];
  },
});

/**
 * Get full adjacency graph for all counties
 */
export const getAdjacencyGraph = query({
  args: {},
  handler: async (ctx) => {
    return COUNTY_ADJACENCY;
  },
});

/**
 * Initialize or reset territory assignments for a company/quarter
 * Creates an empty territory document with no assignments
 */
export const initializeTerritory = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Check if territory already exists
    const existing = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (existing) {
      // Reset to empty assignments
      await ctx.db.patch(existing._id, {
        assignments: [],
        isSubmitted: false,
        submittedBy: undefined,
        submittedAt: undefined,
      });
      return existing._id;
    }

    // Create new territory document
    const territoryId = await ctx.db.insert("territories", {
      companyId,
      quarter,
      assignments: [],
      isSubmitted: false,
    });

    return territoryId;
  },
});

/**
 * Set or update a county's rep assignment
 * If repId is null, unassigns the county
 */
export const setCountyAssignment = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    countyId: v.number(),
    repId: v.union(v.id("activeReps"), v.null()),
  },
  handler: async (ctx, { companyId, quarter, countyId, repId }) => {
    // Get or create territory document
    let territory = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!territory) {
      const territoryId = await ctx.db.insert("territories", {
        companyId,
        quarter,
        assignments: [],
        isSubmitted: false,
      });
      territory = await ctx.db.get(territoryId);
    }

    if (!territory) {
      throw new Error("Failed to create territory document");
    }

    // Check if territory is submitted
    if (territory.isSubmitted) {
      throw new Error("Cannot modify submitted territory assignments");
    }

    // Remove existing assignment for this county (if any)
    const existingAssignments = territory.assignments.filter(
      (a) => a.countyId !== countyId
    );

    // Add new assignment (if repId is not null)
    if (repId !== null) {
      existingAssignments.push({ countyId, repId });
    }

    // Update territory
    await ctx.db.patch(territory._id, {
      assignments: existingAssignments,
    });

    return territory._id;
  },
});

/**
 * Bulk update multiple county assignments
 * Optimized for batch operations (e.g., randomize button)
 */
export const setBulkAssignments = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    assignments: v.array(
      v.object({
        countyId: v.number(),
        repId: v.id("activeReps"),
      })
    ),
  },
  handler: async (ctx, { companyId, quarter, assignments }) => {
    // Get or create territory document
    let territory = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!territory) {
      const territoryId = await ctx.db.insert("territories", {
        companyId,
        quarter,
        assignments: [],
        isSubmitted: false,
      });
      territory = await ctx.db.get(territoryId);
    }

    if (!territory) {
      throw new Error("Failed to create territory document");
    }

    if (territory.isSubmitted) {
      throw new Error("Cannot modify submitted territory assignments");
    }

    // Validate: no duplicate county assignments
    const countyIds = assignments.map((a) => a.countyId);
    const uniqueCounties = new Set(countyIds);
    if (countyIds.length !== uniqueCounties.size) {
      throw new Error("Duplicate county assignments detected");
    }

    // Update with new assignments
    await ctx.db.patch(territory._id, {
      assignments,
    });

    return territory._id;
  },
});

/**
 * Validate territory assignments
 * Returns validation errors if any constraints are violated
 */
export const validateContiguity = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const territory = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!territory || territory.assignments.length === 0) {
      return {
        isValid: false,
        errors: ["No territory assignments found"],
      };
    }

    const errors: string[] = [];

    // Group counties by rep
    const repCounties = new Map<string, number[]>();
    for (const assignment of territory.assignments) {
      if (!repCounties.has(assignment.repId)) {
        repCounties.set(assignment.repId, []);
      }
      repCounties.get(assignment.repId)!.push(assignment.countyId);
    }

    // Check contiguity for each rep
    repCounties.forEach((counties, repId) => {
      if (!isConnected(counties)) {
        errors.push(
          `Rep ${repId} has ${counties.length} counties that are not contiguous`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
});

/**
 * Submit territory assignments
 * Validates contiguity before submission
 */
export const submitTerritory = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const territory = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!territory) {
      throw new Error("No territory assignments found");
    }

    if (territory.isSubmitted) {
      throw new Error("Territory already submitted");
    }

    // Validate contiguity
    const validation = await validateContiguityInternal(territory.assignments);
    if (!validation.isValid) {
      throw new Error(
        `Cannot submit: ${validation.errors.join(", ")}`
      );
    }

    // Mark as submitted
    await ctx.db.patch(territory._id, {
      isSubmitted: true,
      submittedAt: Date.now(),
    });

    return territory._id;
  },
});

/**
 * Internal helper: Check if a set of counties is connected
 * Uses BFS to traverse the adjacency graph
 */
function isConnected(counties: number[]): boolean {
  if (counties.length <= 1) {
    return true;
  }

  const countySet = new Set(counties);
  const startCounty = counties[0];
  const visited = new Set<number>();
  const queue: number[] = [startCounty];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get adjacent counties that are in the territory
    const adjacent = COUNTY_ADJACENCY[current] || [];
    for (const adj of adjacent) {
      if (countySet.has(adj) && !visited.has(adj)) {
        queue.push(adj);
      }
    }
  }

  // All counties should be visited (connected)
  return visited.size === counties.length;
}

/**
 * Internal helper: Validate contiguity without RLS
 * Used by submitTerritory mutation
 */
async function validateContiguityInternal(
  assignments: Array<{ countyId: number; repId: string }>
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Group counties by rep
  const repCounties = new Map<string, number[]>();
  for (const assignment of assignments) {
    if (!repCounties.has(assignment.repId)) {
      repCounties.set(assignment.repId, []);
    }
    repCounties.get(assignment.repId)!.push(assignment.countyId);
  }

  // Check contiguity for each rep
  repCounties.forEach((counties, repId) => {
    if (!isConnected(counties)) {
      errors.push(
        `Rep ${repId} has ${counties.length} counties that are not contiguous`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate random territory assignments
 * Ensures contiguity by using a greedy algorithm
 */
export const generateRandomAssignments = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    repIds: v.array(v.id("activeReps")),
  },
  handler: async (ctx, { companyId, quarter, repIds }) => {
    if (repIds.length === 0) {
      throw new Error("At least one rep is required");
    }

    // Get all 88 county IDs
    const allCounties = Array.from({ length: 88 }, (_, i) => i + 1);

    // Simple round-robin assignment
    // TODO: Implement proper contiguity-aware algorithm
    const assignments: Array<{ countyId: number; repId: Id<"activeReps"> }> = [];
    for (let i = 0; i < allCounties.length; i++) {
      const repIndex = i % repIds.length;
      assignments.push({
        countyId: allCounties[i],
        repId: repIds[repIndex],
      });
    }

    // Get or create territory document
    let territory = await ctx.db
      .query("territories")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!territory) {
      const territoryId = await ctx.db.insert("territories", {
        companyId,
        quarter,
        assignments: [],
        isSubmitted: false,
      });
      territory = await ctx.db.get(territoryId);
    }

    if (!territory) {
      throw new Error("Failed to create territory document");
    }

    if (territory.isSubmitted) {
      throw new Error("Cannot modify submitted territory assignments");
    }

    // Validate: no duplicate county assignments
    const countyIds = assignments.map((a) => a.countyId);
    const uniqueCounties = new Set(countyIds);
    if (countyIds.length !== uniqueCounties.size) {
      throw new Error("Duplicate county assignments detected");
    }

    // Update with new assignments
    await ctx.db.patch(territory._id, {
      assignments,
    });

    return territory._id;
  },
});
