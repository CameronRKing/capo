/**
 * Seed Historical Data (Completed Quarters)
 *
 * Creates historical game data for E2E testing:
 * - Compilations (Q1 hiring, Q2 leadership)
 * - Rep performance reports (Q1)
 * - Financial reports (Q1)
 * - Hiring outcome reports (Q1)
 *
 * Usage: Run this mutation via Convex Dashboard → Functions → seeds → seedHistoricalData
 *
 * IMPORTANT: Run seedGameSetup first to create game, companies, and admin user
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { RESUMES } from "../services/seedData/resumes";

/**
 * Helper: Generate random number in range
 */
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Seed historical data for completed quarters
 *
 * Creates:
 * - Q1 hiring compilation (success)
 * - Q2 leadership compilation (success)
 * - Rep performance reports (10-15 per company, Q1)
 * - Financial reports (all 6 companies, Q1)
 * - Hiring outcome reports (all 6 companies, Q1)
 *
 * @param gameId - Game ID (from seedGameSetup)
 * @param companyIds - Array of company IDs (from seedGameSetup)
 * @param adminId - Admin user ID (from seedGameSetup)
 * @returns Object with success status and creation counts
 */
export const seedHistoricalData = mutation({
  args: {
    gameId: v.id("games"),
    companyIds: v.array(v.id("companies")),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results: any = {
      compilations: [],
      performanceReports: [],
      financialReports: [],
      hiringOutcomes: [],
      errors: [],
    };

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000;

    // =====================================================
    // Step 1: Create Compilations
    // =====================================================

    // Q1 Hiring Compilation
    try {
      const q1CompilationId = await ctx.db.insert("compilations", {
        gameId: args.gameId,
        quarter: 1,
        phase: "hiring",
        status: "success",
        startedAt: oneHourAgo,
        completedAt: oneHourAgo + 30 * 60 * 1000, // 30 minutes later
        compiledBy: args.adminId,
        companiesProcessed: args.companyIds.length,
        errorMessage: undefined,
      });
      results.compilations.push(q1CompilationId);
    } catch (error) {
      results.errors.push(`Failed to create Q1 compilation: ${error}`);
    }

    // Q2 Leadership Compilation
    try {
      const q2CompilationId = await ctx.db.insert("compilations", {
        gameId: args.gameId,
        quarter: 2,
        phase: "leadership",
        status: "success",
        startedAt: twoHoursAgo,
        completedAt: twoHoursAgo + 30 * 60 * 1000, // 30 minutes later
        compiledBy: args.adminId,
        companiesProcessed: args.companyIds.length,
        errorMessage: undefined,
      });
      results.compilations.push(q2CompilationId);
    } catch (error) {
      results.errors.push(`Failed to create Q2 compilation: ${error}`);
    }

    // =====================================================
    // Step 2: Create Rep Performance Reports (Q1)
    // =====================================================

    for (const companyId of args.companyIds) {
      // Create 10-15 performance reports per company
      const repCount = 10 + Math.floor(Math.random() * 6); // 10-15 reps

      for (let i = 0; i < repCount; i++) {
        const resumeIndex = (i * 3) % RESUMES.length;
        const resume = RESUMES[resumeIndex];

        const sales = randomInRange(50000, 150000);
        const salary = randomInRange(50000, 70000);
        const commission = Math.floor(sales * 0.05);
        const expenses = randomInRange(5000, 10000);
        const contributionMargin = sales - salary - commission - expenses;

        try {
          const reportId = await ctx.db.insert("repPerformanceReports", {
            companyId: companyId as any,
            quarter: 1,
            repId: resume.repId,
            name: resume.name,
            sales,
            daysWorked: randomInRange(60, 65),
            totalCalls: randomInRange(800, 1200),
            battingAvg: parseFloat((Math.random() * 0.2 + 0.15).toFixed(2)), // 0.15-0.35
            workload: randomInRange(150, 200),
            salary,
            commission,
            salesContest: Math.random() > 0.8 ? "Winner" : undefined, // 20% chance
            expenses,
            contributionMargin,
            behavior: "Support",
            marketShare: randomInRange(5, 15),
          });
          results.performanceReports.push(reportId);
        } catch (error) {
          results.errors.push(`Failed to create performance report: ${error}`);
        }
      }
    }

    // =====================================================
    // Step 3: Create Financial Reports (Q1)
    // =====================================================

    for (const companyId of args.companyIds) {
      // Get all performance reports for this company to calculate totals
      const companyReports = [];
      for (const reportId of results.performanceReports) {
        const report = await ctx.db.get(reportId);
        if (report && report.companyId === companyId) {
          companyReports.push(report);
        }
      }

      // Calculate totals
      const totalRepSalaries = companyReports.reduce((sum, r) => sum + (r.sales || 0), 0);
      const totalCommissions = companyReports.reduce((sum, r) => sum + (r.commission || 0), 0);
      const totalBenefits = Math.floor(totalRepSalaries * 0.2);
      const totalSales = companyReports.reduce((sum, r) => sum + (r.sales || 0), 0);
      const grossMargin = Math.floor(totalSales * 0.4);

      const totalTravel = randomInRange(20000, 40000);
      const managerCommission = 50000;
      const managerBenefits = 10000;
      const trainingExpenses = randomInRange(15000, 25000);
      const terminationExpenses = 0;
      const clericalExpenses = 10000;
      const rentAndUtilities = 15000;
      const legalAndOtherExpenses = 5000;

      // Random market research expense (50% chance)
      const marketResearchExpense = Math.random() > 0.5 ? 5000 : 0;

      // Random contest budget (30% chance)
      const totalContestBudget = Math.random() > 0.7 ? 5000 : 0;

      const totalExpenses =
        totalRepSalaries +
        totalCommissions +
        totalBenefits +
        totalContestBudget +
        totalTravel +
        managerCommission +
        managerBenefits +
        trainingExpenses +
        terminationExpenses +
        clericalExpenses +
        rentAndUtilities +
        legalAndOtherExpenses +
        marketResearchExpense;

      const netIncome = grossMargin - totalExpenses;

      try {
        const reportId = await ctx.db.insert("financialReports", {
          companyId: companyId as any,
          quarter: 1,
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
        });
        results.financialReports.push(reportId);
      } catch (error) {
        results.errors.push(`Failed to create financial report: ${error}`);
      }
    }

    // =====================================================
    // Step 4: Create Hiring Outcome Reports (Q1)
    // =====================================================

    for (const companyId of args.companyIds) {
      // Simulate hiring outcomes
      // 80% retained, 20% poached
      // 70% hired, 30% not hired

      const oldRepOutcomes: any[] = [];
      const newRepOutcomes: any[] = [];

      // Old rep outcomes (5-10 reps)
      const oldRepCount = 5 + Math.floor(Math.random() * 6);
      for (let i = 0; i < oldRepCount; i++) {
        const resumeIndex = (i * 2) % RESUMES.length;
        const outcome = Math.random() > 0.2 ? "retained" : "poached"; // 80% retained
        oldRepOutcomes.push({
          repId: RESUMES[resumeIndex].repId,
          outcome,
        });
      }

      // New rep outcomes (5-8 reps)
      const newRepCount = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < newRepCount; i++) {
        const resumeIndex = ((oldRepCount + i) * 3) % RESUMES.length;
        const outcome = Math.random() > 0.3 ? "hired" : "not_hired"; // 70% hired
        newRepOutcomes.push({
          repId: RESUMES[resumeIndex].repId,
          outcome,
        });
      }

      try {
        const reportId = await ctx.db.insert("hiringOutcomeReports", {
          companyId: companyId as any,
          quarter: 1,
          oldRepOutcomes,
          newRepOutcomes,
        });
        results.hiringOutcomes.push(reportId);
      } catch (error) {
        results.errors.push(`Failed to create hiring outcome report: ${error}`);
      }
    }

    // =====================================================
    // Return Results
    // =====================================================

    return {
      success: true,
      message: "Historical data seeded successfully",
      results: {
        compilationCount: results.compilations.length,
        performanceReportCount: results.performanceReports.length,
        financialReportCount: results.financialReports.length,
        hiringOutcomeCount: results.hiringOutcomes.length,
        errorCount: results.errors.length,
        errors: results.errors,
      },
    };
  },
});

/**
 * Rollback historical data
 *
 * Deletes all compilations, reports, and hiring outcomes.
 *
 * @returns Object with success status and deletion counts
 */
export const rollbackHistoricalData = mutation({
  args: {},
  handler: async (ctx) => {
    let deletedCompilations = 0;
    let deletedPerformanceReports = 0;
    let deletedFinancialReports = 0;
    let deletedHiringOutcomes = 0;

    // Delete all compilations
    const compilations = await ctx.db.query("compilations").collect();
    for (const compilation of compilations) {
      await ctx.db.delete(compilation._id);
      deletedCompilations++;
    }

    // Delete all rep performance reports
    const performanceReports = await ctx.db.query("repPerformanceReports").collect();
    for (const report of performanceReports) {
      await ctx.db.delete(report._id);
      deletedPerformanceReports++;
    }

    // Delete all financial reports
    const financialReports = await ctx.db.query("financialReports").collect();
    for (const report of financialReports) {
      await ctx.db.delete(report._id);
      deletedFinancialReports++;
    }

    // Delete all hiring outcome reports
    const hiringOutcomes = await ctx.db.query("hiringOutcomeReports").collect();
    for (const outcome of hiringOutcomes) {
      await ctx.db.delete(outcome._id);
      deletedHiringOutcomes++;
    }

    return {
      success: true,
      message: "Historical data rolled back successfully",
      results: {
        deletedCompilations,
        deletedPerformanceReports,
        deletedFinancialReports,
        deletedHiringOutcomes,
      },
    };
  },
});
