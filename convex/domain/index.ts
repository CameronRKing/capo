/**
 * Domain Module Index
 *
 * Exports all domain functions for Convex API.
 */

// Access Requests
export * from "./accessRequests";

// Active Reps - renamed to avoid conflicts
export {
  listByCompanyQuarter,
  updateRepSettings,
  create as createActiveRep,
  get as getActiveRep,
} from "./activeReps";

// Companies - renamed to avoid conflicts
export {
  get as getCompany,
  listByGame,
  create as createCompany,
} from "./companies";

// Decisions
export * from "./decisions/persistence";
export * from "./decisions/validators";

// Leadership Decisions - renamed to avoid conflicts
export {
  get as getLeadershipDecision,
  create as createLeadershipDecision,
} from "./leadershipDecisions";

// Games - renamed to avoid conflicts
export {
  getGame,
  getCurrentPhase,
  getPhaseStatus,
  create as createGame,
} from "./games";

// Rankings
export * from "./rankings";
export * from "./rankings/algorithm";

// Reports - renamed to avoid conflicts
export {
  getRepPerformanceByRep,
  listRepPerformanceByCompany,
  createRepPerformance,
  getFinancialByCompanyQuarter,
  listFinancialByGame,
  createFinancial,
  getHiringOutcomesByCompany,
  createHiringOutcomes,
  getHiringOutcomeReport as getHiringOutcomeReportQLS,
  getFinancialReport,
  getRepPerformanceReport,
  getReportsByCompany,
  getReportsByGame,
  listAllReports,
} from "./reports";

// Resumes
export * from "./resumes";

// Territories
export * from "./territories";

// Users
export * from "./users";

// Internal
export * from "./internal";
