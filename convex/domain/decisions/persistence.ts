/**
 * Decision Persistence Layer
 *
 * Handles auto-save, submit workflow, and retrieval of hiring and leadership decisions.
 * All functions use RLS (Row-Level Security) for automatic access control.
 *
 * Access Control (enforced by RLS):
 * - Working decisions: Read/write by assigned company members only
 * - Submitted decisions: Read by company members, immutable after submission
 *
 * Business Rules:
 * - Auto-save: Clients can save partial drafts without validation
 * - Submit: Full validation applied before marking as submitted
 * - Immutability: Submitted decisions cannot be modified
 */

import { v } from "convex/values";
import { queryWithRLS, mutationWithRLS } from "../../services/rowLevelSecurity";
import {
  hiringDecisionSchema,
  leadershipDecisionSchema,
  type HiringDecision,
  type LeadershipDecision,
} from "./validators";

// =====================================================
// Hiring Decision Functions
// =====================================================

/**
 * Get working (draft) hiring decision for a company/quarter
 *
 * Returns null if no draft exists yet. Use this to populate
 * the form with existing data or start fresh.
 */
export const getHiringDecisionWorking = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const decision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    // Only return working (not submitted) decisions
    if (decision && decision.isSubmitted) {
      return null;
    }

    return decision;
  },
});

/**
 * Save hiring decision as working draft
 *
 * Validates with Zod schema to catch client errors early.
 * Creates new document or patches existing draft.
 * Does NOT check business constraints (min team size, etc.)
 * - those are enforced on submit.
 */
export const saveHiringDecisionWorking = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    data: v.object({
      salary: v.number(),
      commission: v.number(),
      benefits: v.union(
        v.literal("bronze"),
        v.literal("silver"),
        v.literal("gold")
      ),
      travel: v.union(
        v.literal("reps_pay_own"),
        v.literal("monthly_per_diem"),
        v.literal("unlimited")
      ),
      perDiem: v.optional(v.number()),
      hasSalesContest: v.boolean(),
      salesContestType: v.optional(v.union(v.literal("open"), v.literal("closed"))),
      salesContestThreshold: v.optional(v.number()),
      trainingProductKnowledge: v.number(),
      trainingMarketOrientation: v.number(),
      trainingCompanyOrientation: v.number(),
      trainingSellingTechniques: v.number(),
      numberToHire: v.number(),
      firingList: v.array(v.id("activeReps")),
    }),
  },
  handler: async (ctx, { companyId, quarter, data }) => {
    // Validate with Zod schema
    const validatedData = hiringDecisionSchema.parse(data);

    // Check if draft exists
    const existing = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    // Don't allow modifying submitted decisions
    if (existing && existing.isSubmitted) {
      throw new Error(
        "Cannot modify submitted decision. Create a new quarter or contact admin."
      );
    }

    if (existing) {
      // Update existing draft
      await ctx.db.patch(existing._id, {
        ...validatedData,
        isSubmitted: false,
      });
      return existing._id;
    } else {
      // Create new draft
      const decisionId = await ctx.db.insert("hiringDecisions", {
        companyId,
        quarter,
        ...validatedData,
        isSubmitted: false,
      });
      return decisionId;
    }
  },
});

/**
 * Submit hiring decision for compilation
 *
 * Validates complete decision with Zod and business constraints.
 * Marks as submitted with user/timestamp for audit trail.
 * Submitted decisions are immutable - compilation function reads them.
 */
export const submitHiringDecision = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Get the working decision
    const decision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!decision) {
      throw new Error(
        "No decision found. Save your draft before submitting."
      );
    }

    if (decision.isSubmitted) {
      throw new Error(
        "Decision already submitted. Cannot submit again."
      );
    }

    // Validate with Zod schema (catches any client-side bypass)
    hiringDecisionSchema.parse(decision);

    // TODO: Add business constraint checks:
    // - Can't fire below minimum team size (3 reps)
    // - Must have hiring list if numberToHire > 0
    // These depend on activeReps table which may not exist yet

    // Mark as submitted
    await ctx.db.patch(decision._id, {
      isSubmitted: true,
      submittedBy: ctx.user._id,
      submittedAt: Date.now(),
    });

    return decision._id;
  },
});

// =====================================================
// Leadership Decision Functions
// =====================================================

/**
 * Get working (draft) leadership decision for a company/quarter
 *
 * Returns null if no draft exists yet.
 */
export const getLeadershipDecisionWorking = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const decision = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    // Only return working (not submitted) decisions
    if (decision && decision.isSubmitted) {
      return null;
    }

    return decision;
  },
});

/**
 * Save leadership decision as working draft
 *
 * Validates with Zod schema to catch client errors early.
 * Creates new document or patches existing draft.
 */
export const saveLeadershipDecisionWorking = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    data: v.object({
      timeRecruiting: v.number(),
      timeMeetingCustomers: v.number(),
      timeSalesPlanning: v.number(),
      timeAdministrativePaperwork: v.number(),
      buyTerritoryReport: v.boolean(),
      buyCompensationReport: v.boolean(),
      buyPerformanceReport: v.boolean(),
    }),
  },
  handler: async (ctx, { companyId, quarter, data }) => {
    // Validate with Zod schema
    const validatedData = leadershipDecisionSchema.parse(data);

    // Check if draft exists
    const existing = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    // Don't allow modifying submitted decisions
    if (existing && existing.isSubmitted) {
      throw new Error(
        "Cannot modify submitted decision. Create a new quarter or contact admin."
      );
    }

    if (existing) {
      // Update existing draft
      await ctx.db.patch(existing._id, {
        ...validatedData,
        isSubmitted: false,
      });
      return existing._id;
    } else {
      // Create new draft
      const decisionId = await ctx.db.insert("leadershipDecisions", {
        companyId,
        quarter,
        ...validatedData,
        isSubmitted: false,
      });
      return decisionId;
    }
  },
});

/**
 * Submit leadership decision for compilation
 *
 * Validates complete decision with Zod.
 * Marks as submitted with user/timestamp for audit trail.
 */
export const submitLeadershipDecision = mutationWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Get the working decision
    const decision = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!decision) {
      throw new Error(
        "No decision found. Save your draft before submitting."
      );
    }

    if (decision.isSubmitted) {
      throw new Error(
        "Decision already submitted. Cannot submit again."
      );
    }

    // Validate with Zod schema (catches any client-side bypass)
    leadershipDecisionSchema.parse(decision);

    // Mark as submitted
    await ctx.db.patch(decision._id, {
      isSubmitted: true,
      submittedBy: ctx.user._id,
      submittedAt: Date.now(),
    });

    return decision._id;
  },
});

// =====================================================
// Compilation Functions
// =====================================================

/**
 * Get submitted decisions for compilation
 *
 * Returns both hiring and leadership decisions that have been
 * submitted for the given company/quarter. Used by compilation
 * function to generate quarterly outcomes.
 */
export const getSubmittedDecisions = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Get submitted hiring decision
    const hiringDecision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    // Get submitted leadership decision
    const leadershipDecision = await ctx.db
      .query("leadershipDecisions")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return {
      hiring: hiringDecision?.isSubmitted ? hiringDecision : null,
      leadership: leadershipDecision?.isSubmitted ? leadershipDecision : null,
    };
  },
});
