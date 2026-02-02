/**
 * Decision Validation Schemas
 *
 * Zod validation schemas for hiring and leadership decisions using convex-helpers.
 * Provides comprehensive client-side and server-side validation with cross-field constraints.
 *
 * Business Rules:
 * - Hiring: Salary $30k-$100k, Commission 0-20%, Training sum=100%, Max hire=3, Min reps=3
 * - Leadership: Time allocation sum=100%, Per diem required when travel=2
 */

import { z } from "zod";

// =====================================================
// Business Constants
// =====================================================

export const MIN_SALARY = 30000;
export const MAX_SALARY = 100000;
export const MIN_COMMISSION = 0;
export const MAX_COMMISSION = 20; // 20%
export const MAX_HIRE_COUNT = 3;
export const MIN_REPS = 3;
export const MIN_PER_DIEM = 0;
export const MAX_PER_DIEM = 100;
export const SALES_CONTEST_MULTIPLIER = 7.0;

// =====================================================
// Hiring Decision Schema
// =====================================================

/**
 * Hiring Decision Validation Schema
 *
 * Fields:
 * - Compensation: salary, commission, benefits, travel, perDiem (conditional)
 * - Sales Contest: hasSalesContest, salesContestType, salesContestThreshold (conditional)
 * - Training: trainingProductKnowledge, trainingMarketOrientation, trainingCompanyOrientation, trainingSellingTechniques
 * - Hiring & Firing: numberToHire, firingList
 *
 * Cross-field Constraints:
 * 1. Training allocation must sum to 100%
 * 2. Minimum training: product_knowledge >= 25%, selling_techniques >= 30%
 * 3. Per diem required when travel="monthly_per_diem"
 * 4. Sales contest threshold required when hasSalesContest=true
 */
export const hiringDecisionSchema = z.object({
  // Compensation
  salary: z
    .number()
    .int()
    .min(MIN_SALARY, `Salary must be at least $${MIN_SALARY.toLocaleString()}`)
    .max(MAX_SALARY, `Salary cannot exceed $${MAX_SALARY.toLocaleString()}`),

  commission: z
    .number()
    .min(MIN_COMMISSION, `Commission must be at least ${MIN_COMMISSION}%`)
    .max(MAX_COMMISSION, `Commission cannot exceed ${MAX_COMMISSION}%`),

  benefits: z.enum(["bronze", "silver", "gold"], {
    errorMap: () => ({ message: "Benefits must be bronze, silver, or gold" }),
  }),

  travel: z.enum(["reps_pay_own", "monthly_per_diem", "unlimited"], {
    errorMap: () => ({ message: "Travel must be reps_pay_own, monthly_per_diem, or unlimited" }),
  }),

  perDiem: z
    .number()
    .min(MIN_PER_DIEM, `Per diem must be at least $${MIN_PER_DIEM}`)
    .max(MAX_PER_DIEM, `Per diem cannot exceed $${MAX_PER_DIEM}`)
    .optional(),

  // Sales Contest
  hasSalesContest: z.boolean(),

  salesContestType: z
    .enum(["open", "closed"], {
      errorMap: () => ({ message: "Sales contest type must be open or closed" }),
    })
    .optional(),

  salesContestThreshold: z
    .number()
    .min(0, "Sales contest threshold must be non-negative")
    .max(100000, "Sales contest threshold cannot exceed $100,000")
    .optional(),

  // Training Time Allocation (must sum to 100)
  trainingProductKnowledge: z
    .number()
    .min(0, "Product knowledge training must be non-negative")
    .max(100, "Product knowledge training cannot exceed 100%"),

  trainingMarketOrientation: z
    .number()
    .min(0, "Market orientation training must be non-negative")
    .max(100, "Market orientation training cannot exceed 100%"),

  trainingCompanyOrientation: z
    .number()
    .min(0, "Company orientation training must be non-negative")
    .max(100, "Company orientation training cannot exceed 100%"),

  trainingSellingTechniques: z
    .number()
    .min(0, "Selling techniques training must be non-negative")
    .max(100, "Selling techniques training cannot exceed 100%"),

  // Hiring & Firing
  numberToHire: z
    .number()
    .int()
    .min(0, "Number to hire must be non-negative")
    .max(MAX_HIRE_COUNT, `Cannot hire more than ${MAX_HIRE_COUNT} reps per quarter`),

  firingList: z
    .array(z.string())
    .max(100, "Cannot fire more than 100 reps at once")
    .default([]),
})

// Cross-field constraint: Training allocation must sum to 100%
.refine(
  (data) => {
    const sum =
      data.trainingProductKnowledge +
      data.trainingMarketOrientation +
      data.trainingCompanyOrientation +
      data.trainingSellingTechniques;
    return sum === 100;
  },
  {
    message: "Training allocation must sum to 100%",
    path: ["trainingProductKnowledge"], // Error attached to first field
  }
)

// Cross-field constraint: Minimum training requirements
.refine(
  (data) => data.trainingProductKnowledge >= 25,
  {
    message: "Product knowledge training must be at least 25%",
    path: ["trainingProductKnowledge"],
  }
)

.refine(
  (data) => data.trainingSellingTechniques >= 30,
  {
    message: "Selling techniques training must be at least 30%",
    path: ["trainingSellingTechniques"],
  }
)

// Cross-field constraint: Per diem required when travel="monthly_per_diem"
.refine(
  (data) => {
    if (data.travel === "monthly_per_diem") {
      return data.perDiem !== undefined && data.perDiem >= MIN_PER_DIEM;
    }
    return true;
  },
  {
    message: `Per diem must be specified when travel package is "monthly_per_diem"`,
    path: ["perDiem"],
  }
)

// Cross-field constraint: Sales contest threshold required when contest is open
.refine(
  (data) => {
    if (data.hasSalesContest && data.salesContestType === "open") {
      return data.salesContestThreshold !== undefined && data.salesContestThreshold >= 0;
    }
    return true;
  },
  {
    message: "Sales contest threshold must be specified when contest is open",
    path: ["salesContestThreshold"],
  }
);

// =====================================================
// Leadership Decision Schema
// =====================================================

/**
 * Leadership Decision Validation Schema
 *
 * Fields:
 * - Time Allocation: timeRecruiting, timeMeetingCustomers, timeSalesPlanning, timeAdministrativePaperwork
 * - Market Reports: buyTerritoryReport, buyCompensationReport, buyPerformanceReport
 *
 * Cross-field Constraints:
 * 1. Time allocation must sum to 100%
 * 2. Minimum supervision: recruiting, meeting_customers, sales_planning >= 5%
 */
export const leadershipDecisionSchema = z.object({
  // Manager Time Allocation (must sum to 100)
  timeRecruiting: z
    .number()
    .min(0, "Recruiting time must be non-negative")
    .max(100, "Recruiting time cannot exceed 100%"),

  timeMeetingCustomers: z
    .number()
    .min(0, "Meeting customers time must be non-negative")
    .max(100, "Meeting customers time cannot exceed 100%"),

  timeSalesPlanning: z
    .number()
    .min(0, "Sales planning time must be non-negative")
    .max(100, "Sales planning time cannot exceed 100%"),

  timeAdministrativePaperwork: z
    .number()
    .min(0, "Administrative paperwork time must be non-negative")
    .max(100, "Administrative paperwork time cannot exceed 100%"),

  // Market Reports
  buyTerritoryReport: z.boolean(),
  buyCompensationReport: z.boolean(),
  buyPerformanceReport: z.boolean(),
})

// Cross-field constraint: Time allocation must sum to 100%
.refine(
  (data) => {
    const sum =
      data.timeRecruiting +
      data.timeMeetingCustomers +
      data.timeSalesPlanning +
      data.timeAdministrativePaperwork;
    return sum === 100;
  },
  {
    message: "Time allocation must sum to 100%",
    path: ["timeRecruiting"], // Error attached to first field
  }
)

// Cross-field constraint: Minimum supervision requirements
.refine(
  (data) => data.timeRecruiting >= 5,
  {
    message: "Recruiting time must be at least 5%",
    path: ["timeRecruiting"],
  }
)

.refine(
  (data) => data.timeMeetingCustomers >= 5,
  {
    message: "Meeting customers time must be at least 5%",
    path: ["timeMeetingCustomers"],
  }
)

.refine(
  (data) => data.timeSalesPlanning >= 5,
  {
    message: "Sales planning time must be at least 5%",
    path: ["timeSalesPlanning"],
  }
);

// =====================================================
// Type Exports
// =====================================================

export type HiringDecision = z.infer<typeof hiringDecisionSchema>;
export type LeadershipDecision = z.infer<typeof leadershipDecisionSchema>;
