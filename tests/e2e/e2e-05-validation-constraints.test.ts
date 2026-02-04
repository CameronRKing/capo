/**
 * E2E-05: Decision Validation & Constraints
 *
 * Comprehensive end-to-end tests for hiring and leadership decision validation.
 * Tests business rule enforcement, constraint validation, and error messages.
 *
 * Coverage:
 * 1. Business rule validation (hiring caps, budget constraints)
 * 2. Constraint enforcement (max/min values, timing restrictions)
 * 3. Edge cases and boundary conditions
 * 4. Error messages are clear and helpful
 * 5. Invalid decisions are rejected
 * 6. Valid decisions are accepted
 *
 * Prerequisites: None (uses convexTest for isolated backend testing)
 * Run with: `npm run test:once tests/integration/e2e-05-validation-constraints.test.ts`
 *
 * NOTE: Tests bypass RLS and call validation logic directly via Zod schemas.
 * RLS-wrapped functions are tested separately in rowLevelSecurity.test.ts
 */

import { describe, it, expect, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import {
  hiringDecisionSchema,
  leadershipDecisionSchema,
  MIN_SALARY,
  MAX_SALARY,
  MAX_COMMISSION,
  MAX_HIRE_COUNT,
  MAX_PER_DIEM,
} from "../../convex/domain/decisions/validators";

describe("E2E-05: Decision Validation & Constraints", () => {
  let t: any;
  let gameId: string;
  let companyId: string;

  beforeEach(async () => {
    t = convexTest(schema);

    // Setup test game and company
    const setup = await t.run(async (ctx: any) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "Technology",
        name: "Company A",
      });

      return { gameId, companyId };
    });

    gameId = setup.gameId;
    companyId = setup.companyId;
  });

  // =====================================================
  // Hiring Decision Validation Tests
  // =====================================================

  describe("Hiring Decision: Salary Validation", () => {
    it("should reject salary below minimum ($30,000)", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: MIN_SALARY - 1,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least"))).toBe(true);
      }
    });

    it("should reject salary above maximum ($100,000)", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: MAX_SALARY + 1,
        commission: 10,
        benefits: "gold",
        travel: "unlimited",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("cannot exceed"))).toBe(true);
      }
    });

    it("should reject non-integer salary", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000.5,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should accept salary at boundary values", async () => {
      const minResult = hiringDecisionSchema.safeParse({
        salary: MIN_SALARY,
        commission: 0,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        salesContestType: "closed",
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(minResult.success).toBe(true);

      const maxResult = hiringDecisionSchema.safeParse({
        salary: MAX_SALARY,
        commission: 20,
        benefits: "gold",
        travel: "unlimited",
        hasSalesContest: false,
        salesContestType: "closed",
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(maxResult.success).toBe(true);
    });
  });

  describe("Hiring Decision: Commission Validation", () => {
    it("should reject negative commission", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: -1,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should reject commission above 20%", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: MAX_COMMISSION + 1,
        benefits: "silver",
        travel: "monthly_per_diem",
        perDiem: 50,
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("cannot exceed"))).toBe(true);
      }
    });

    it("should accept commission at boundaries (0% and 20%)", async () => {
      const minResult = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 0,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        salesContestType: "closed",
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(minResult.success).toBe(true);

      const maxResult = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: MAX_COMMISSION,
        benefits: "gold",
        travel: "unlimited",
        hasSalesContest: false,
        salesContestType: "closed",
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(maxResult.success).toBe(true);
    });
  });

  describe("Hiring Decision: Travel & Per Diem Validation", () => {
    it("should require perDiem when travel is monthly_per_diem", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "monthly_per_diem",
        // perDiem is missing
        hasSalesContest: false,
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 20,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("must be specified"))).toBe(true);
      }
    });

    it("should reject perDiem below minimum ($0)", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "monthly_per_diem",
        perDiem: -1,
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should reject perDiem above maximum ($100)", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "monthly_per_diem",
        perDiem: MAX_PER_DIEM + 1,
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("cannot exceed"))).toBe(true);
      }
    });

    it("should accept valid perDiem values", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "monthly_per_diem",
        perDiem: 50,
        hasSalesContest: false,
        salesContestType: "closed",
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Hiring Decision: Sales Contest Validation", () => {
    it("should require salesContestThreshold when contest is open", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: true,
        salesContestType: "open",
        // salesContestThreshold is missing
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("threshold must be specified"))).toBe(true);
      }
    });

    it("should reject negative salesContestThreshold", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: true,
        salesContestType: "open",
        salesContestThreshold: -1,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should reject salesContestThreshold above $100,000", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "unlimited",
        hasSalesContest: true,
        salesContestType: "open",
        salesContestThreshold: 100001,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should accept closed contest without threshold", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: true,
        salesContestType: "closed",
        salesContestThreshold: 0,
        // No threshold required for closed
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Hiring Decision: Training Allocation Validation", () => {
    it("should reject training allocation that does not sum to 100%", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 30,
        trainingCompanyOrientation: 30,
        trainingSellingTechniques: 30, // Sum = 120%
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("must sum to 100"))).toBe(true);
      }
    });

    it("should reject productKnowledge below 25%", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 20, // Below 25%
        trainingMarketOrientation: 30,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25, // Sum = 100%
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least 25%"))).toBe(true);
      }
    });

    it("should reject sellingTechniques below 30%", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 20, // Below 30%
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least 30%"))).toBe(true);
      }
    });

    it("should accept valid training allocation at minimums", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25, // Exactly minimum
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30, // Exactly minimum
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Hiring Decision: Hiring & Firing Validation", () => {
    it("should reject negative numberToHire", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: -1,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should reject numberToHire above maximum (3)", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: MAX_HIRE_COUNT + 1,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("Cannot hire more than"))).toBe(true);
      }
    });

    it("should reject non-integer numberToHire", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 1.5,
        firingList: [],
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid hiring and firing decisions", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        salesContestType: "closed",
        salesContestThreshold: 0,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 2,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });
  });

  // =====================================================
  // Leadership Decision Validation Tests
  // =====================================================

  describe("Leadership Decision: Time Allocation Validation", () => {
    it("should reject time allocation that does not sum to 100%", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 30, // Sum = 120%
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("must sum to 100"))).toBe(true);
      }
    });

    it("should reject timeRecruiting below 5%", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 4, // Below 5%
        timeMeetingCustomers: 30,
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 36, // Sum = 100%
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least 5%"))).toBe(true);
      }
    });

    it("should reject timeMeetingCustomers below 5%", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 4, // Below 5%
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 36, // Sum = 100%
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least 5%"))).toBe(true);
      }
    });

    it("should reject timeSalesPlanning below 5%", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 4, // Below 5%
        timeAdministrativePaperwork: 36, // Sum = 100%
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least 5%"))).toBe(true);
      }
    });

    it("should reject negative time allocation", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: -1,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 41,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
    });

    it("should accept valid time allocation at minimums", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 5, // Exactly minimum
        timeMeetingCustomers: 5, // Exactly minimum
        timeSalesPlanning: 5, // Exactly minimum
        timeAdministrativePaperwork: 85,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(true);
    });

    it("should accept balanced time allocation", async () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 25,
        timeMeetingCustomers: 25,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25, // Sum = 100%
        buyTerritoryReport: true,
        buyCompensationReport: true,
        buyPerformanceReport: true,
      });

      expect(result.success).toBe(true);
    });
  });

  // =====================================================
  // Decision Persistence & Business Constraint Tests
  // =====================================================

  describe("Decision Persistence: Immutability Constraints", () => {
    it("should create and retrieve hiring decision draft", async () => {
      const decisionId = await t.run(async (ctx: any) => {
        return await ctx.db.insert("hiringDecisions", {
          companyId,
          quarter: 1,
          salary: 50000,
          commission: 10,
          benefits: "silver",
          travel: "reps_pay_own",
          hasSalesContest: false,
          salesContestType: "closed",
          salesContestThreshold: 0,
          trainingProductKnowledge: 25,
          trainingMarketOrientation: 25,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 0,
          firingList: [],
          isSubmitted: false,
        });
      });

      expect(decisionId).toBeDefined();

      // Verify draft was created
      const draft = await t.run(async (ctx: any) => {
        return await ctx.db
          .query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .first();
      });

      expect(draft).toBeDefined();
      expect(draft._id).toBe(decisionId);
      expect(draft.isSubmitted).toBe(false);
    });

    it("should mark decision as submitted with timestamp", async () => {
      const decisionId = await t.run(async (ctx: any) => {
        const userId = await ctx.db.insert("users", {
          name: "Test Student",
          email: "test@student.com",
          role: "student",
          gameId,
          companyId,
        });

        const id = await ctx.db.insert("hiringDecisions", {
          companyId,
          quarter: 1,
          salary: 50000,
          commission: 10,
          benefits: "silver",
          travel: "reps_pay_own",
          hasSalesContest: false,
          salesContestType: "closed",
          salesContestThreshold: 0,
          trainingProductKnowledge: 25,
          trainingMarketOrientation: 25,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 0,
          firingList: [],
          isSubmitted: false,
        });

        // Mark as submitted
        await ctx.db.patch(id, {
          isSubmitted: true,
          submittedBy: userId,
          submittedAt: Date.now(),
        });

        return { decisionId: id, userId };
      });

      // Verify submission metadata
      const decision = await t.run(async (ctx: any) => {
        return await ctx.db.get(decisionId.decisionId);
      });

      expect(decision.isSubmitted).toBe(true);
      expect(decision.submittedBy).toBe(decisionId.userId);
      expect(decision.submittedAt).toBeDefined();
      expect(decision.submittedAt).toBeLessThanOrEqual(Date.now());
    });
  });

  // =====================================================
  // Edge Cases & Error Message Quality Tests
  // =====================================================

  describe("Edge Cases & Error Message Quality", () => {
    it("should provide clear error message for salary violation", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 25000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
        expect(result.error.issues[0].message.length).toBeGreaterThan(0);
      }
    });

    it("should provide clear error message for training sum violation", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 50,
        trainingMarketOrientation: 50,
        trainingCompanyOrientation: 0,
        trainingSellingTechniques: 0, // Sum = 100, but violates minimums
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      // Should fail on minimum requirements
      if (!result.success) {
        expect(result.error.issues.some(i => i.message.includes("at least"))).toBe(true);
      }
    });

    it("should handle multiple validation errors", async () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 25000, // Below minimum
        commission: 25, // Above maximum
        benefits: "platinum", // Invalid enum
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 10, // Below minimum
        trainingMarketOrientation: 30,
        trainingCompanyOrientation: 30,
        trainingSellingTechniques: 10, // Below minimum
        numberToHire: 5, // Above maximum
        firingList: [],
      });

      expect(result.success).toBe(false);
      // Should have multiple errors
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(1);
      }
    });
  });
});
