/**
 * Business Constants
 *
 * This module contains all business constants from the legacy Capo! simulation code.
 * These values are used throughout the application for hiring logic, compensation
 * calculations, expense computations, and other business rules.
 *
 * Source: Legacy PHP Constants class from the original Capo! application
 */

// =============================================================================
// HIRING AND TEAM CONSTRAINTS
// =============================================================================

/**
 * Minimum number of sales representatives required per company.
 *
 * Used for:
 * - Validation of firing decisions (cannot fire below this threshold)
 * - Hiring eligibility checks (must have at least this many reps to be poached)
 *
 * @constant {number}
 * @default 3
 */
export const MIN_REPS = 3;

/**
 * Maximum number of sales representatives a company can hire per quarter.
 *
 * Used for:
 * - Validation of hiring decisions (num_to_hire field)
 * - Limiting quarterly hiring capacity
 *
 * @constant {number}
 * @default 3
 */
export const MAX_HIRE_COUNT = 3;

// =============================================================================
// REVENUE AND PERFORMANCE
// =============================================================================

/**
 * Cost of goods sold as a percentage of revenue (65%).
 *
 * Used for:
 * - Calculating gross margin: total_sales * (1 - COST_OF_GOODS)
 * - Computing contribution margin
 * - Determining profitability metrics
 *
 * @constant {number}
 * @default 0.65
 */
export const COST_OF_GOODS = 0.65;

/**
 * Base performance metric total.
 *
 * Used for:
 * - Calculating individual rep performance shares
 * - Determining territory sales distribution
 * - Performance-based calculations
 *
 * Formula: rep_share = rep_performance / TOTAL_PERFORMANCE
 *
 * @constant {number}
 * @default 40
 */
export const TOTAL_PERFORMANCE = 40;

/**
 * Territory potential per person unit.
 *
 * Used for:
 * - Calculating territory market potential
 * - Determining sales capacity per territory
 *
 * Note: Originally double this value in early versions
 *
 * @constant {number}
 * @default 21.78
 */
export const POTENTIAL_PER_PERSON = 21.78;

/**
 * Population base unit per territory.
 *
 * Used for:
 * - Territory size calculations
 * - Market potential computations
 *
 * @constant {number}
 * @default 20000
 */
export const POPULATION_PER_UNIT = 20000;

// =============================================================================
// MANAGER COMPENSATION (QUARTERLY)
// =============================================================================

/**
 * Manager commission rate as a percentage of total sales (2%).
 *
 * Used for:
 * - Calculating manager commission: ceil(total_sales * MANAGER_COMMISSION)
 * - Manager benefits calculations
 *
 * @constant {number}
 * @default 0.02
 */
export const MANAGER_COMMISSION = 0.02;

/**
 * Manager base salary per quarter.
 *
 * Used for:
 * - Overhead expense calculations
 * - Manager benefits: (manager_commission + MANAGER_SALARY_QTR) * 0.2
 * - Added to reports as manager_salary field
 *
 * @constant {number}
 * @default 20000
 */
export const MANAGER_SALARY_QTR = 20000;

/**
 * Manager travel budget per quarter.
 *
 * Used for:
 * - Overhead expense calculations
 * - Added to reports as manager_travel field
 *
 * @constant {number}
 * @default 750
 */
export const MANAGER_TRAVEL_QTR = 750;

// =============================================================================
// HIRING-RELATED EXPENSES (PER OCCURRENCE)
// =============================================================================

/**
 * Expenses incurred per terminated sales representative.
 *
 * Used for:
 * - Calculating termination expenses: TERMINATION_EXPENSES * numFires
 * - Direct expense computations
 *
 * @constant {number}
 * @default 15000
 */
export const TERMINATION_EXPENSES = 15000;

/**
 * Training expenses per new hire.
 *
 * Used for:
 * - Calculating training expenses: TRAINING_EXPENSES * numNewHires
 * - Direct expense computations
 *
 * @constant {number}
 * @default 6000
 */
export const TRAINING_EXPENSES = 6000;

/**
 * Recruiting bonus added to attractiveness index.
 *
 * Used for:
 * - Calculating rep attractiveness index
 * - Incentivizing recruitment in decision-making
 * - Formula: recruiting_percentage * RECRUITING_BONUS
 *
 * @constant {number}
 * @default 2000
 */
export const RECRUITING_BONUS = 2000;

// =============================================================================
// OVERHEAD EXPENSES (QUARTERLY)
// =============================================================================

/**
 * Fixed clerical expenses per quarter.
 *
 * Used for:
 * - Overhead expense calculations
 * - Fixed operational costs
 *
 * @constant {number}
 * @default 10000
 */
export const CLERICAL_EXPENSES = 10000;

/**
 * Base rent and utilities per quarter (with random variance).
 *
 * Used for:
 * - Calculating rent_and_utilities: ceil((90-110% of RENT_AND_UTILITIES) + random(-100 to 100))
 * - Overhead expense calculations
 *
 * Note: Actual value varies quarterly with random variance applied
 *
 * @constant {number}
 * @default 7500
 */
export const RENT_AND_UTILITIES = 7500;

/**
 * Base legal and other expenses per quarter.
 *
 * Used for:
 * - Calculating legal_and_other_expenses: LEGAL_AND_OTHER + sum(notice costs)
 * - Overhead expense calculations
 * - Adding notice/penalty costs
 *
 * @constant {number}
 * @default 10000
 */
export const LEGAL_AND_OTHER = 10000;

// =============================================================================
// MARKET RESEARCH REPORT COSTS
// =============================================================================

/**
 * Cost to purchase the competitive salesperson performance report.
 *
 * Used for:
 * - Market research expense calculation
 * - Decision: salesrep_report checkbox
 * - Effect: -1 performance modifier for all reps when purchased
 *
 * @constant {number}
 * @default 10000
 */
export const SALESREP_REPORT_COST = 10000;

/**
 * Cost to purchase the competitive compensation report.
 *
 * Used for:
 * - Market research expense calculation
 * - Decision: compensation_report checkbox
 * - Effect: Information only, no performance modifier
 *
 * @constant {number}
 * @default 10000
 */
export const COMPENSATION_REPORT_COST = 10000;

// =============================================================================
// ATTRACTIVENESS INDEX CALCULATION
// =============================================================================

/**
 * Assumed quarterly sales for attractiveness index calculations.
 *
 * Used for:
 * - Calculating rep attractiveness index
 * - Estimating commission expenses for attractiveness
 * - Normalizing attractiveness comparisons
 *
 * @constant {number}
 * @default 300000
 */
export const ASSUMED_SALES_PER_QTR = 300000;

// =============================================================================
// COMPANY METADATA
// =============================================================================

/**
 * Default company names for the simulation.
 *
 * Used for:
 * - Company identification
 * - Display purposes
 *
 * Indexed by company position (1-4)
 *
 * @constant {string[]}
 * @default ["Aromatics", "Bioscent", "Candelarium", "Dynowick"]
 */
export const COMPANY_NAMES = [
  "Aromatics",
  "Bioscent",
  "Candelarium",
  "Dynowick",
] as const;

/**
 * Type definition for company names
 */
export type CompanyName = (typeof COMPANY_NAMES)[number];
