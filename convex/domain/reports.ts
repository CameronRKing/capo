import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { queryWithRLS } from "../services/rowLevelSecurity";

/**
 * Reports Domain Module
 *
 * Provides query and mutation functions for accessing and creating
 * performance and financial reports with RLS protection.
 */

// =============================================================================
// REP PERFORMANCE REPORTS
// =============================================================================

export const getRepPerformanceByRep = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    repId: v.string(),
  },
  handler: async (ctx, { companyId, quarter, repId }) => {
    const report = await ctx.db
      .query("repPerformanceReports")
      .withIndex("by_company_quarter", (q) => 
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .filter((q) => q.eq(q.field("repId"), repId))
      .first();

    return report;
  },
});

export const listRepPerformanceByCompany = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const reports = await ctx.db
      .query("repPerformanceReports")
      .withIndex("by_company_quarter", (q) => 
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .collect();

    return reports;
  },
});

export const createRepPerformance = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    repId: v.string(),
    name: v.string(),
    sales: v.number(),
    daysWorked: v.number(),
    totalCalls: v.number(),
    battingAvg: v.number(),
    workload: v.number(),
    salary: v.number(),
    commission: v.number(),
    salesContest: v.optional(v.string()),
    expenses: v.number(),
    contributionMargin: v.number(),
    behavior: v.string(),
    marketShare: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("repPerformanceReports", args);
    return id;
  },
});

// =============================================================================
// FINANCIAL REPORTS
// =============================================================================

export const getFinancialByCompanyQuarter = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const report = await ctx.db
      .query("financialReports")
      .withIndex("by_company_quarter", (q) => 
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return report;
  },
});

export const listFinancialByGame = query({
  args: {
    gameIds: v.array(v.id("games")),
    quarter: v.number(),
  },
  handler: async (ctx, { gameIds, quarter }) => {
    // Get all companies in the game
    const companies = await Promise.all(
      gameIds.map((gameId) =>
        ctx.db
          .query("companies")
          .withIndex("by_game", (q) => q.eq("gameId", gameId))
          .collect()
      )
    );

    const companyIds = companies.flat().map((c) => c._id);

    // Get all financial reports for these companies
    const reports = await Promise.all(
      companyIds.map((companyId) =>
        ctx.db
          .query("financialReports")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", quarter)
          )
          .first()
      )
    );

    return reports.filter((r) => r !== null);
  },
});

export const createFinancial = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    totalRepSalaries: v.number(),
    totalCommissions: v.number(),
    totalBenefits: v.number(),
    totalContestBudget: v.number(),
    totalTravel: v.number(),
    managerCommission: v.number(),
    managerBenefits: v.number(),
    trainingExpenses: v.number(),
    terminationExpenses: v.number(),
    clericalExpenses: v.number(),
    rentAndUtilities: v.number(),
    legalAndOtherExpenses: v.number(),
    marketResearchExpense: v.number(),
    totalSales: v.number(),
    grossMargin: v.number(),
    totalExpenses: v.number(),
    netIncome: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("financialReports", args);
    return id;
  },
});

// =============================================================================
// HIRING OUTCOME REPORTS
// =============================================================================

export const getHiringOutcomesByCompany = query({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const report = await ctx.db
      .query("hiringOutcomeReports")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return report;
  },
});

export const createHiringOutcomes = mutation({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    oldRepOutcomes: v.array(
      v.object({
        repId: v.string(),
        outcome: v.union(v.literal("retained"), v.literal("poached")),
      })
    ),
    newRepOutcomes: v.array(
      v.object({
        repId: v.string(),
        outcome: v.union(v.literal("hired"), v.literal("not_hired")),
      })
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("hiringOutcomeReports", args);
    return id;
  },
});

// =============================================================================
// RLS-PROTECTED REPORT QUERIES
// =============================================================================

/**
 * Query: Get hiring outcome report for a company and quarter
 *
 * RLS: Students see their company only, teachers see all companies in their game
 */
export const getHiringOutcomeReport = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const report = await ctx.db
      .query("hiringOutcomeReports")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return report;
  },
});

/**
 * Query: Get financial report for a company and quarter
 *
 * RLS: Students see their company only, teachers see all companies in their game
 */
export const getFinancialReport = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const report = await ctx.db
      .query("financialReports")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return report;
  },
});

/**
 * Query: Get rep performance report for a company, quarter, and rep
 *
 * RLS: Students see their company only, teachers see all companies in their game
 */
export const getRepPerformanceReport = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
    repId: v.string(),
  },
  handler: async (ctx, { companyId, quarter, repId }) => {
    const report = await ctx.db
      .query("repPerformanceReports")
      .withIndex("by_company_quarter", (q) =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .filter((q) => q.eq(q.field("repId"), repId))
      .first();

    return report;
  },
});

/**
 * Query: Get all reports for a company and quarter
 *
 * Returns hiring outcomes, financials, and rep performance in a single query
 * RLS: Students see their company only, teachers see all companies in their game
 */
export const getReportsByCompany = queryWithRLS({
  args: {
    companyId: v.id("companies"),
    quarter: v.number(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // Get all three report types in parallel
    const [hiringOutcomes, financials, repPerformance] = await Promise.all([
      ctx.db
        .query("hiringOutcomeReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", quarter)
        )
        .first(),
      ctx.db
        .query("financialReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", quarter)
        )
        .first(),
      ctx.db
        .query("repPerformanceReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", quarter)
        )
        .collect(),
    ]);

    return {
      hiringOutcomes,
      financials,
      repPerformance,
    };
  },
});

/**
 * Query: Get all reports for all companies in a game and quarter
 *
 * Aggregates reports across all companies in a game
 * RLS: Teachers see their game, students see only their company's reports
 */
export const getReportsByGame = queryWithRLS({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
  },
  handler: async (ctx, { gameId, quarter }) => {
    // Get all companies in the game (RLS will filter based on role)
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Get reports for each company
    const reports = await Promise.all(
      companies.map(async (company) => {
        const [hiringOutcomes, financials, repPerformance] = await Promise.all([
          ctx.db
            .query("hiringOutcomeReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id).eq("quarter", quarter)
            )
            .first(),
          ctx.db
            .query("financialReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id).eq("quarter", quarter)
            )
            .first(),
          ctx.db
            .query("repPerformanceReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id).eq("quarter", quarter)
            )
            .collect(),
        ]);

        return {
          company,
          reports: {
            hiringOutcomes,
            financials,
            repPerformance,
          },
        };
      })
    );

    return reports;
  },
});

/**
 * Query: List all reports across all quarters for a game
 *
 * Provides a historical view of all reports for a game
 * RLS: Teachers see their game, students see only their company's reports
 */
export const listAllReports = queryWithRLS({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, { gameId }) => {
    // Get all companies in the game (RLS will filter based on role)
    const companies = await ctx.db
      .query("companies")
      .withIndex("by_game", (q) => q.eq("gameId", gameId))
      .collect();

    // Get all report types for all companies across all quarters
    const [hiringOutcomes, financials, repPerformance] = await Promise.all([
      Promise.all(
        companies.map((company) =>
          ctx.db
            .query("hiringOutcomeReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id)
            )
            .collect()
        )
      ),
      Promise.all(
        companies.map((company) =>
          ctx.db
            .query("financialReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id)
            )
            .collect()
        )
      ),
      Promise.all(
        companies.map((company) =>
          ctx.db
            .query("repPerformanceReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id)
            )
            .collect()
        )
      ),
    ]);

    // Flatten and group by company
    return companies.map((company, idx) => ({
      company,
      reports: {
        hiringOutcomes: hiringOutcomes[idx],
        financials: financials[idx],
        repPerformance: repPerformance[idx],
      },
    }));
  },
});
