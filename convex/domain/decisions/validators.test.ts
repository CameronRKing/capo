/**
 * Decision Validators Tests
 *
 * Comprehensive test coverage for hiring and leadership decision validation schemas.
 * Tests all field constraints, cross-field validations, and edge cases.
 */

import { describe, it, expect } from "vitest";
import {
  hiringDecisionSchema,
  leadershipDecisionSchema,
  MIN_SALARY,
  MAX_SALARY,
  MAX_COMMISSION,
  MAX_HIRE_COUNT,
  MIN_REPS,
  MAX_PER_DIEM,
} from "./validators";

describe("Hiring Decision Schema", () => {
  describe("Valid Hiring Decisions", () => {
    it("should accept a valid hiring decision with minimum values", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: MIN_SALARY,
        commission: 0,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });

    it("should accept a valid hiring decision with maximum values", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: MAX_SALARY,
        commission: MAX_COMMISSION,
        benefits: "gold",
        travel: "unlimited",
        hasSalesContest: true,
        salesContestType: "open",
        salesContestThreshold: 50000,
        trainingProductKnowledge: 40,
        trainingMarketOrientation: 20,
        trainingCompanyOrientation: 10,
        trainingSellingTechniques: 30,
        numberToHire: MAX_HIRE_COUNT,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });

    it("should accept a valid hiring decision with monthly per diem", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "monthly_per_diem",
        perDiem: 50,
        hasSalesContest: false,
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 20,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30,
        numberToHire: 1,
        firingList: ["rep1", "rep2"],
      });

      expect(result.success).toBe(true);
    });

    it("should accept a valid hiring decision with closed sales contest", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 60000,
        commission: 15,
        benefits: "gold",
        travel: "unlimited",
        hasSalesContest: true,
        salesContestType: "closed",
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 20,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30,
        numberToHire: 2,
        firingList: [],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Salary Validation", () => {
    it("should reject salary below minimum", () => {
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
        expect(result.error.issues[0].message).toContain("at least");
      }
    });

    it("should reject salary above maximum", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: MAX_SALARY + 1,
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
        expect(result.error.issues[0].message).toContain("cannot exceed");
      }
    });

    it("should reject non-integer salary", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000.5,
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
    });
  });

  describe("Commission Validation", () => {
    it("should reject negative commission", () => {
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

    it("should reject commission above 20%", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: MAX_COMMISSION + 1,
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
        expect(result.error.issues[0].message).toContain("cannot exceed");
      }
    });
  });

  describe("Benefits Validation", () => {
    it("should reject invalid benefits level", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "platinum",
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
        expect(result.error.issues[0].message).toMatch(/bronze|silver|gold/);
      }
    });
  });

  describe("Travel and Per Diem Validation", () => {
    it("should reject per diem below minimum", () => {
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

    it("should reject per diem above maximum", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
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
        expect(result.error.issues[0].message).toContain("cannot exceed");
      }
    });

    it("should require per diem when travel is monthly_per_diem", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
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
        expect(result.error.issues.some((issue) => issue.message.includes("must be specified"))).toBe(true);
      }
    });
  });

  describe("Sales Contest Validation", () => {
    it("should require threshold when contest is open", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: true,
        salesContestType: "open",
        // salesContestThreshold is missing
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 20,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30,
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.message.includes("threshold must be specified"))).toBe(true);
      }
    });

    it("should reject negative sales contest threshold", () => {
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

    it("should reject sales contest threshold above $100,000", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
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
  });

  describe("Training Allocation Validation", () => {
    it("should reject training allocation that does not sum to 100%", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 30,
        trainingCompanyOrientation: 30,
        trainingSellingTechniques: 30, // Sum = 120
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must sum to 100");
      }
    });

    it("should reject training allocation below minimum for product knowledge", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 20, // Below 25% minimum
        trainingMarketOrientation: 30,
        trainingCompanyOrientation: 20,
        trainingSellingTechniques: 30, // Sum = 100
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 25%");
      }
    });

    it("should reject training allocation below minimum for selling techniques", () => {
      const result = hiringDecisionSchema.safeParse({
        salary: 50000,
        commission: 10,
        benefits: "bronze",
        travel: "reps_pay_own",
        hasSalesContest: false,
        trainingProductKnowledge: 30,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 20, // Below 30% minimum
        numberToHire: 0,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const productKnowledgeError = result.error.issues.find(
          (issue) => issue.path[0] === "trainingSellingTechniques"
        );
        expect(productKnowledgeError?.message).toContain("at least 30%");
      }
    });
  });

  describe("Hiring and Firing Validation", () => {
    it("should reject negative number to hire", () => {
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

    it("should reject number to hire above maximum", () => {
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
        numberToHire: MAX_HIRE_COUNT + 1,
        firingList: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(`Cannot hire more than ${MAX_HIRE_COUNT}`);
      }
    });

    it("should reject non-integer number to hire", () => {
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
  });
});

describe("Leadership Decision Schema", () => {
  describe("Valid Leadership Decisions", () => {
    it("should accept a valid leadership decision with minimum supervision", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 5,
        timeMeetingCustomers: 5,
        timeSalesPlanning: 5,
        timeAdministrativePaperwork: 85,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(true);
    });

    it("should accept a valid leadership decision with balanced allocation", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 25,
        timeMeetingCustomers: 25,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25,
        buyTerritoryReport: true,
        buyCompensationReport: true,
        buyPerformanceReport: true,
      });

      expect(result.success).toBe(true);
    });

    it("should accept a valid leadership decision with all reports purchased", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 20,
        timeAdministrativePaperwork: 20,
        buyTerritoryReport: true,
        buyCompensationReport: true,
        buyPerformanceReport: true,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Time Allocation Validation", () => {
    it("should reject time allocation that does not sum to 100%", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 30, // Sum = 120
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("must sum to 100");
      }
    });

    it("should reject time allocation below minimum for recruiting", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 4, // Below 5% minimum
        timeMeetingCustomers: 30,
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 36, // Sum = 100
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === "timeRecruiting")).toBe(true);
        const recruitingError = result.error.issues.find(
          (issue) => issue.path[0] === "timeRecruiting"
        );
        expect(recruitingError?.message).toContain("at least 5%");
      }
    });

    it("should reject time allocation below minimum for meeting customers", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 4, // Below 5% minimum
        timeSalesPlanning: 30,
        timeAdministrativePaperwork: 36, // Sum = 100
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const meetingError = result.error.issues.find(
          (issue) => issue.path[0] === "timeMeetingCustomers"
        );
        expect(meetingError?.message).toContain("at least 5%");
      }
    });

    it("should reject time allocation below minimum for sales planning", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 30,
        timeMeetingCustomers: 30,
        timeSalesPlanning: 4, // Below 5% minimum
        timeAdministrativePaperwork: 36, // Sum = 100
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const planningError = result.error.issues.find(
          (issue) => issue.path[0] === "timeSalesPlanning"
        );
        expect(planningError?.message).toContain("at least 5%");
      }
    });

    it("should reject negative time allocation", () => {
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

    it("should reject time allocation above 100%", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 101,
        timeMeetingCustomers: 0,
        timeSalesPlanning: 0,
        timeAdministrativePaperwork: -1,
        buyTerritoryReport: false,
        buyCompensationReport: false,
        buyPerformanceReport: false,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Market Reports Validation", () => {
    it("should accept valid boolean values for market reports", () => {
      const result = leadershipDecisionSchema.safeParse({
        timeRecruiting: 25,
        timeMeetingCustomers: 25,
        timeSalesPlanning: 25,
        timeAdministrativePaperwork: 25,
        buyTerritoryReport: true,
        buyCompensationReport: false,
        buyPerformanceReport: true,
      });

      expect(result.success).toBe(true);
    });
  });
});

describe("Edge Cases and Error Messages", () => {
  it("should provide clear error message for salary violation", () => {
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

  it("should provide clear error message for training sum violation", () => {
    const result = hiringDecisionSchema.safeParse({
      salary: 50000,
      commission: 10,
      benefits: "bronze",
      travel: "reps_pay_own",
      hasSalesContest: false,
      trainingProductKnowledge: 50,
      trainingMarketOrientation: 50,
      trainingCompanyOrientation: 0,
      trainingSellingTechniques: 0, // Sum = 100
      numberToHire: 0,
      firingList: [],
    });

    // This should fail minimum requirements even though sum is 100
    expect(result.success).toBe(false);
  });

  it("should handle missing required fields", () => {
    const result = hiringDecisionSchema.safeParse({});

    expect(result.success).toBe(false);
  });
});
