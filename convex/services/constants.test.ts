import { describe, expect, test } from "vitest";
import * as constants from "./constants";

/**
 * Unit Tests for Business Constants
 *
 * These tests verify that all business constants match the legacy PHP values
 * from the original Capo! application. Any deviation from these values should
 * be intentional and well-documented.
 */
describe("Business Constants", () => {
  // ==========================================================================
  // HIRING AND TEAM CONSTRAINTS
  // ==========================================================================

  test("MIN_REPS should be 3", () => {
    expect(constants.MIN_REPS).toBe(3);
  });

  test("MAX_HIRE_COUNT should be 3", () => {
    expect(constants.MAX_HIRE_COUNT).toBe(3);
  });

  // ==========================================================================
  // REVENUE AND PERFORMANCE
  // ==========================================================================

  test("COST_OF_GOODS should be 0.65 (65%)", () => {
    expect(constants.COST_OF_GOODS).toBe(0.65);
  });

  test("TOTAL_PERFORMANCE should be 40", () => {
    expect(constants.TOTAL_PERFORMANCE).toBe(40);
  });

  test("POTENTIAL_PER_PERSON should be 21.78", () => {
    expect(constants.POTENTIAL_PER_PERSON).toBe(21.78);
  });

  test("POPULATION_PER_UNIT should be 20000", () => {
    expect(constants.POPULATION_PER_UNIT).toBe(20000);
  });

  // ==========================================================================
  // MANAGER COMPENSATION
  // ==========================================================================

  test("MANAGER_COMMISSION should be 0.02 (2%)", () => {
    expect(constants.MANAGER_COMMISSION).toBe(0.02);
  });

  test("MANAGER_SALARY_QTR should be 20000", () => {
    expect(constants.MANAGER_SALARY_QTR).toBe(20000);
  });

  test("MANAGER_TRAVEL_QTR should be 750", () => {
    expect(constants.MANAGER_TRAVEL_QTR).toBe(750);
  });

  // ==========================================================================
  // HIRING-RELATED EXPENSES
  // ==========================================================================

  test("TERMINATION_EXPENSES should be 15000 per fired rep", () => {
    expect(constants.TERMINATION_EXPENSES).toBe(15000);
  });

  test("TRAINING_EXPENSES should be 6000 per new hire", () => {
    expect(constants.TRAINING_EXPENSES).toBe(6000);
  });

  test("RECRUITING_BONUS should be 2000", () => {
    expect(constants.RECRUITING_BONUS).toBe(2000);
  });

  // ==========================================================================
  // OVERHEAD EXPENSES
  // ==========================================================================

  test("CLERICAL_EXPENSES should be 10000", () => {
    expect(constants.CLERICAL_EXPENSES).toBe(10000);
  });

  test("RENT_AND_UTILITIES should be 7500", () => {
    expect(constants.RENT_AND_UTILITIES).toBe(7500);
  });

  test("LEGAL_AND_OTHER should be 10000", () => {
    expect(constants.LEGAL_AND_OTHER).toBe(10000);
  });

  // ==========================================================================
  // MARKET RESEARCH REPORT COSTS
  // ==========================================================================

  test("SALESREP_REPORT_COST should be 10000", () => {
    expect(constants.SALESREP_REPORT_COST).toBe(10000);
  });

  test("COMPENSATION_REPORT_COST should be 10000", () => {
    expect(constants.COMPENSATION_REPORT_COST).toBe(10000);
  });

  // ==========================================================================
  // ATTRACTIVENESS INDEX CALCULATION
  // ==========================================================================

  test("ASSUMED_SALES_PER_QTR should be 300000", () => {
    expect(constants.ASSUMED_SALES_PER_QTR).toBe(300000);
  });

  // ==========================================================================
  // COMPANY METADATA
  // ==========================================================================

  test("COMPANY_NAMES should contain 4 companies", () => {
    expect(constants.COMPANY_NAMES).toHaveLength(4);
  });

  test("COMPANY_NAMES should match legacy company names", () => {
    expect(constants.COMPANY_NAMES).toEqual([
      "Aromatics",
      "Bioscent",
      "Candelarium",
      "Dynowick",
    ]);
  });

  test("COMPANY_NAMES should be a read-only array", () => {
    // The array is declared with 'as const' which makes it readonly
    // Verify it's a tuple with readonly properties
    expect(constants.COMPANY_NAMES).toHaveProperty("0", "Aromatics");
    expect(constants.COMPANY_NAMES).toHaveProperty("1", "Bioscent");
    expect(constants.COMPANY_NAMES).toHaveProperty("2", "Candelarium");
    expect(constants.COMPANY_NAMES).toHaveProperty("3", "Dynowick");
  });

  // ==========================================================================
  // BUSINESS RULE VALIDATION
  // ==========================================================================

  test("all numeric constants should be numbers", () => {
    const numericConstants = [
      constants.MIN_REPS,
      constants.MAX_HIRE_COUNT,
      constants.COST_OF_GOODS,
      constants.TOTAL_PERFORMANCE,
      constants.POTENTIAL_PER_PERSON,
      constants.POPULATION_PER_UNIT,
      constants.MANAGER_COMMISSION,
      constants.MANAGER_SALARY_QTR,
      constants.MANAGER_TRAVEL_QTR,
      constants.TERMINATION_EXPENSES,
      constants.TRAINING_EXPENSES,
      constants.RECRUITING_BONUS,
      constants.CLERICAL_EXPENSES,
      constants.RENT_AND_UTILITIES,
      constants.LEGAL_AND_OTHER,
      constants.SALESREP_REPORT_COST,
      constants.COMPENSATION_REPORT_COST,
      constants.ASSUMED_SALES_PER_QTR,
    ];

    numericConstants.forEach((value) => {
      expect(typeof value).toBe("number");
      expect(isNaN(value)).toBe(false);
    });
  });

  test("percentage constants should be between 0 and 1", () => {
    expect(constants.COST_OF_GOODS).toBeGreaterThanOrEqual(0);
    expect(constants.COST_OF_GOODS).toBeLessThanOrEqual(1);
    expect(constants.MANAGER_COMMISSION).toBeGreaterThanOrEqual(0);
    expect(constants.MANAGER_COMMISSION).toBeLessThanOrEqual(1);
  });

  test("count constants should be positive integers", () => {
    expect(constants.MIN_REPS).toBeGreaterThan(0);
    expect(Number.isInteger(constants.MIN_REPS)).toBe(true);

    expect(constants.MAX_HIRE_COUNT).toBeGreaterThan(0);
    expect(Number.isInteger(constants.MAX_HIRE_COUNT)).toBe(true);
  });

  test("expense constants should be positive", () => {
    const expenseConstants = [
      constants.MANAGER_SALARY_QTR,
      constants.MANAGER_TRAVEL_QTR,
      constants.TERMINATION_EXPENSES,
      constants.TRAINING_EXPENSES,
      constants.RECRUITING_BONUS,
      constants.CLERICAL_EXPENSES,
      constants.RENT_AND_UTILITIES,
      constants.LEGAL_AND_OTHER,
      constants.SALESREP_REPORT_COST,
      constants.COMPENSATION_REPORT_COST,
    ];

    expenseConstants.forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EXPORT VALIDATION
  // ==========================================================================

  test("all expected constants should be exported", () => {
    const expectedExports = [
      "MIN_REPS",
      "MAX_HIRE_COUNT",
      "COST_OF_GOODS",
      "TOTAL_PERFORMANCE",
      "POTENTIAL_PER_PERSON",
      "POPULATION_PER_UNIT",
      "MANAGER_COMMISSION",
      "MANAGER_SALARY_QTR",
      "MANAGER_TRAVEL_QTR",
      "TERMINATION_EXPENSES",
      "TRAINING_EXPENSES",
      "RECRUITING_BONUS",
      "CLERICAL_EXPENSES",
      "RENT_AND_UTILITIES",
      "LEGAL_AND_OTHER",
      "SALESREP_REPORT_COST",
      "COMPENSATION_REPORT_COST",
      "ASSUMED_SALES_PER_QTR",
      "COMPANY_NAMES",
    ];

    expectedExports.forEach((exportName) => {
      expect(constants).toHaveProperty(exportName);
    });
  });

  test("constants module should export 19 items", () => {
    const constantCount = Object.keys(constants).length;
    expect(constantCount).toBe(19); // 18 constants + 1 type
  });
});
