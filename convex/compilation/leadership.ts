import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import {
  COST_OF_GOODS,
  MANAGER_SALARY_QTR,
  MANAGER_COMMISSION,
  MANAGER_TRAVEL_QTR,
  TERMINATION_EXPENSES,
  TRAINING_EXPENSES,
  CLERICAL_EXPENSES,
  RENT_AND_UTILITIES,
  LEGAL_AND_OTHER,
  SALESREP_REPORT_COST,
  COMPENSATION_REPORT_COST,
  TOTAL_PERFORMANCE,
} from "../services/constants";

/**
 * Leadership Compilation Action
 * 
 * Generates stub performance and financial reports for all companies in a game/quarter.
 * This is a simplified MVP implementation using randomized dummy data with semantic constraints.
 * 
 * Full business logic from legacy codebase will be implemented post-MVP.
 */
export const _compileLeadershipDecisions = action({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
  },
  handler: async (ctx, { gameId, quarter }) => {
    // 1. Get all companies in the game
    const companies = await ctx.runQuery(api.domain.internal.listGameCompanies, { gameId });

    if (!companies || companies.length === 0) {
      throw new Error(`No companies found for game ${gameId}`);
    }

    const results = {
      companiesProcessed: 0,
      repsProcessed: 0,
      financialReportsGenerated: 0,
      errors: [] as string[],
    };

    // Process each company
    for (const company of companies) {
      try {
        // 2. Get or create default leadership decisions
        const leadershipDecisions = await ctx.runQuery(
          api.domain.internal.getOrCreateDefaultLeadershipDecisions,
          { companyId: company._id, quarter }
        );

        // 3. Get all active reps for this company
        const activeReps = await ctx.runQuery(api.domain.internal.listActiveRepsByCompanyQuarter, {
          companyId: company._id,
          quarter,
        });

        if (!activeReps || activeReps.length === 0) {
          results.errors.push(`No active reps found for company ${company.name}`);
          continue;
        }

        // 4. Generate stub rep performance data
        const repPerformances: any[] = [];
        for (const rep of activeReps) {
          const seed = `${gameId}_${quarter}_${rep._id}`;
          const performance = generateRepPerformance(rep, leadershipDecisions, seed);
          repPerformances.push(performance);

          // Write performance report to database
          await ctx.runMutation(api.domain.reports.createRepPerformance, {
            companyId: company._id,
            quarter,
            repId: rep.repId,
            ...performance,
          });

          results.repsProcessed++;
        }

        // 5. Generate stub financial reports
        const financialData = generateFinancialReports(
          company._id,
          quarter,
          repPerformances,
          leadershipDecisions,
          `${gameId}_${quarter}`
        );

        // Write financial report to database
        await ctx.runMutation(api.domain.reports.createFinancial, {
          companyId: company._id,
          quarter,
          ...financialData,
        });

        results.financialReportsGenerated++;
        results.companiesProcessed++;

      } catch (error) {
        results.errors.push(
          `Error processing company ${company.name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return {
      success: results.errors.length === 0,
      ...results,
    };
  },
});

/**
 * Generate stub rep performance data with semantic constraints
 */
function generateRepPerformance(
  rep: any,
  leadershipDecisions: any,
  seed: string
): {
  name: string;
  sales: number;
  daysWorked: number;
  totalCalls: number;
  battingAvg: number;
  workload: number;
  salary: number;
  commission: number;
  salesContest?: string;
  expenses: number;
  contributionMargin: number;
  behavior: string;
  marketShare: number;
} {
  const seededRandom = seededRandomGenerator(seed);
  
  // Performance score: 1-10 with weighted distribution (more 5-8)
  // Use normal distribution approximation
  const rawScore = seededRandom() * 10;
  let performance = Math.floor(rawScore * 0.6 + 3); // Bias toward 3-9 range
  performance = Math.max(1, Math.min(10, performance));

  // Sales based on performance * territory potential * variance
  const territoryPotential = (rep.territories?.length || 3) * 50000;
  const variance = 0.8 + (seededRandom() * 0.4); // 0.8-1.2
  const sales = Math.floor(territoryPotential * (performance / 10) * variance);

  // Workload based on individual hours (from leadership decisions)
  const workload = rep.individualHours || 40;
  
  // Calls made: 200-500 range based on workload
  const callsPerDay = 8 + Math.floor(seededRandom() * 8); // 8-16 calls/day
  const daysWorked = 60 + Math.floor(seededRandom() * 8); // 60-67 days (quarter)
  const totalCalls = callsPerDay * daysWorked;

  // Batting average: sales/calls (typically 0.2-0.6)
  const battingAvg = Math.max(0.1, Math.min(0.8, (sales / 1000) / totalCalls));

  // Contribution margin: sales * (1 - COST_OF_GOODS)
  const contributionMargin = Math.floor(sales * (1 - COST_OF_GOODS));

  // Expenses (simplified for stub)
  const expenses = Math.floor(sales * 0.05 + seededRandom() * 2000);

  // Market share (randomized for stub)
  const marketShare = Math.floor(seededRandom() * 30) / 100; // 0-30%

  // Sales contest participation (from decisions)
  const salesContest = leadershipDecisions.hasSalesContest ? 
    (performance >= 7 ? "won" : "participated") : 
    undefined;

  return {
    name: rep.repId,
    sales,
    daysWorked,
    totalCalls,
    battingAvg: Math.floor(battingAvg * 1000) / 1000, // Round to 3 decimals
    workload,
    salary: 0, // Will be filled from hiring decisions
    commission: 0, // Will be filled from hiring decisions
    salesContest,
    expenses,
    contributionMargin,
    behavior: rep.leadershipBehavior || "Support",
    marketShare,
  };
}

/**
 * Generate stub financial reports with balanced calculations
 */
function generateFinancialReports(
  companyId: string,
  quarter: number,
  repPerformances: any[],
  leadershipDecisions: any,
  seed: string
): {
  totalRepSalaries: number;
  totalCommissions: number;
  totalBenefits: number;
  totalContestBudget: number;
  totalTravel: number;
  managerCommission: number;
  managerBenefits: number;
  trainingExpenses: number;
  terminationExpenses: number;
  clericalExpenses: number;
  rentAndUtilities: number;
  legalAndOtherExpenses: number;
  marketResearchExpense: number;
  totalSales: number;
  grossMargin: number;
  totalExpenses: number;
  netIncome: number;
} {
  const seededRandom = seededRandomGenerator(seed);
  
  // Sum up all rep sales
  const totalSales = repPerformances.reduce((sum, rep) => sum + rep.sales, 0);

  // Calculate rep compensation (stub values based on sales)
  const totalRepSalaries = repPerformances.length * 15000; // Average quarterly salary
  const totalCommissions = Math.floor(totalSales * 0.05); // 5% average commission
  const totalBenefits = Math.floor(totalRepSalaries * 0.2); // 20% benefits

  // Contest budget (if enabled)
  const totalContestBudget = leadershipDecisions.hasSalesContest ? 
    Math.floor(totalSales * 0.02) : 0;

  // Travel expenses (based on number of reps)
  const totalTravel = repPerformances.length * 2000;

  // Manager compensation
  const managerCommission = Math.ceil(totalSales * MANAGER_COMMISSION);
  const managerBenefits = Math.floor((managerCommission + MANAGER_SALARY_QTR) * 0.2);

  // Training and termination expenses (stub - would normally come from hiring compilation)
  const trainingExpenses = TRAINING_EXPENSES * 2; // Assume 2 new hires
  const terminationExpenses = 0; // Assume no fires for stub

  // Fixed overhead expenses
  const clericalExpenses = CLERICAL_EXPENSES;
  const rentAndUtilities = Math.floor(
    (RENT_AND_UTILITIES * (0.9 + seededRandom() * 0.2)) + // 90-110% variance
    (seededRandom() * 200 - 100) // +/- 100 random
  );
  const legalAndOtherExpenses = LEGAL_AND_OTHER;

  // Market research expenses
  let marketResearchExpense = 0;
  if (leadershipDecisions.buyTerritoryReport) marketResearchExpense += 10000;
  if (leadershipDecisions.buyCompensationReport) marketResearchExpense += COMPENSATION_REPORT_COST;
  if (leadershipDecisions.buyPerformanceReport) marketResearchExpense += SALESREP_REPORT_COST;

  // Calculate totals
  const totalExpenses = 
    totalRepSalaries +
    totalCommissions +
    totalBenefits +
    totalContestBudget +
    totalTravel +
    managerCommission +
    managerBenefits +
    MANAGER_SALARY_QTR +
    MANAGER_TRAVEL_QTR +
    trainingExpenses +
    terminationExpenses +
    clericalExpenses +
    rentAndUtilities +
    legalAndOtherExpenses +
    marketResearchExpense;

  // Gross margin MUST be sales * 0.35
  const grossMargin = Math.floor(totalSales * (1 - COST_OF_GOODS));

  // Net income
  const netIncome = grossMargin - totalExpenses;

  return {
    totalRepSalaries,
    totalCommissions,
    totalBenefits,
    totalContestBudget,
    totalTravel,
    managerCommission,
    managerBenefits,
    trainingExpenses,
    terminationExpenses,
    clericalExpenses,
    rentAndUtilities,
    legalAndOtherExpenses,
    marketResearchExpense,
    totalSales,
    grossMargin,
    totalExpenses,
    netIncome,
  };
}

/**
 * Seeded random number generator for reproducible stub data
 */
function seededRandomGenerator(seed: string): () => number {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use hash as seed for simple LCG
  let state = Math.abs(hash);
  
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}
