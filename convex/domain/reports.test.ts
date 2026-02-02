/**
 * Reports Domain Tests
 *
 * Tests report queries for:
 * - Quarter navigation
 * - Aggregation queries
 * - Report data retrieval logic
 *
 * NOTE: These tests verify the basic query structure and data retrieval.
 * RLS enforcement is covered in rowLevelSecurity.test.ts
 */

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import schema from "../schema";

describe("Reports Domain - Hiring Outcome Reports", () => {
  test("getHiringOutcomeReport logic - returns report for company and quarter", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and hiring outcome report
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create hiring outcome report
      await ctx.db.insert("hiringOutcomeReports", {
        companyId,
        quarter: 1,
        oldRepOutcomes: [
          { repId: "rep1", outcome: "retained" },
          { repId: "rep2", outcome: "poached" },
        ],
        newRepOutcomes: [
          { repId: "rep3", outcome: "hired" },
          { repId: "rep4", outcome: "not_hired" },
        ],
      });

      return { gameId, companyId };
    });

    // Verify the data directly (testing report query logic without RLS)
    const report = await t.run(async (ctx) => {
      return await ctx.db
        .query("hiringOutcomeReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    expect(report).not.toBeNull();
    expect(report?.companyId).toEqual(companyId);
    expect(report?.quarter).toBe(1);
    expect(report?.oldRepOutcomes).toHaveLength(2);
    expect(report?.newRepOutcomes).toHaveLength(2);
    expect(report?.oldRepOutcomes[0].outcome).toBe("retained");
    expect(report?.newRepOutcomes[0].outcome).toBe("hired");
  });

  test("getHiringOutcomeReport logic - returns null for non-existent quarter", async () => {
    const t = convexTest(schema);

    // Setup: Create game and company
    const { companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // No reports created
      return { gameId, companyId };
    });

    // Query for non-existent quarter
    const report = await t.run(async (ctx) => {
      return await ctx.db
        .query("hiringOutcomeReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 2)
        )
        .first();
    });

    expect(report).toBeNull();
  });
});

describe("Reports Domain - Financial Reports", () => {
  test("getFinancialReport logic - returns report for company and quarter", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and financial report
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create financial report
      await ctx.db.insert("financialReports", {
        companyId,
        quarter: 1,
        totalRepSalaries: 250000,
        totalCommissions: 50000,
        totalBenefits: 25000,
        totalContestBudget: 10000,
        totalTravel: 5000,
        managerCommission: 10000,
        managerBenefits: 5000,
        trainingExpenses: 3000,
        terminationExpenses: 2000,
        clericalExpenses: 8000,
        rentAndUtilities: 12000,
        legalAndOtherExpenses: 5000,
        marketResearchExpense: 3000,
        totalSales: 500000,
        grossMargin: 250000,
        totalExpenses: 200000,
        netIncome: 50000,
      });

      return { gameId, companyId };
    });

    // Query the financial report
    const report = await t.run(async (ctx) => {
      return await ctx.db
        .query("financialReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    expect(report).not.toBeNull();
    expect(report?.companyId).toEqual(companyId);
    expect(report?.quarter).toBe(1);
    expect(report?.totalSales).toBe(500000);
    expect(report?.netIncome).toBe(50000);
    expect(report?.totalRepSalaries).toBe(250000);
  });

  test("getFinancialReport logic - handles multiple quarters", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and reports for multiple quarters
    const { companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 3,
        currentPhase: "leadership",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create reports for Q1 and Q2
      await ctx.db.insert("financialReports", {
        companyId,
        quarter: 1,
        totalRepSalaries: 250000,
        totalCommissions: 50000,
        totalBenefits: 25000,
        totalContestBudget: 10000,
        totalTravel: 5000,
        managerCommission: 10000,
        managerBenefits: 5000,
        trainingExpenses: 3000,
        terminationExpenses: 2000,
        clericalExpenses: 8000,
        rentAndUtilities: 12000,
        legalAndOtherExpenses: 5000,
        marketResearchExpense: 3000,
        totalSales: 500000,
        grossMargin: 250000,
        totalExpenses: 200000,
        netIncome: 50000,
      });

      await ctx.db.insert("financialReports", {
        companyId,
        quarter: 2,
        totalRepSalaries: 260000,
        totalCommissions: 55000,
        totalBenefits: 26000,
        totalContestBudget: 12000,
        totalTravel: 6000,
        managerCommission: 11000,
        managerBenefits: 5500,
        trainingExpenses: 3500,
        terminationExpenses: 2500,
        clericalExpenses: 8500,
        rentAndUtilities: 12500,
        legalAndOtherExpenses: 5500,
        marketResearchExpense: 3500,
        totalSales: 550000,
        grossMargin: 275000,
        totalExpenses: 210000,
        netIncome: 65000,
      });

      return { gameId, companyId };
    });

    // Query Q1 report
    const q1Report = await t.run(async (ctx) => {
      return await ctx.db
        .query("financialReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .first();
    });

    // Query Q2 report
    const q2Report = await t.run(async (ctx) => {
      return await ctx.db
        .query("financialReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 2)
        )
        .first();
    });

    expect(q1Report?.netIncome).toBe(50000);
    expect(q2Report?.netIncome).toBe(65000);
    expect(q2Report?.totalSales).toBe(550000);
  });
});

describe("Reports Domain - Rep Performance Reports", () => {
  test("getRepPerformanceReport logic - returns report for specific rep", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and rep performance report
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create rep performance report
      await ctx.db.insert("repPerformanceReports", {
        companyId,
        quarter: 1,
        repId: "rep1",
        name: "John Doe",
        sales: 125000,
        daysWorked: 60,
        totalCalls: 450,
        battingAvg: 0.28,
        workload: 1.0,
        salary: 50000,
        commission: 12500,
        salesContest: "First Place",
        expenses: 2500,
        contributionMargin: 60000,
        behavior: "Praise",
        marketShare: 15.5,
      });

      return { gameId, companyId };
    });

    // Query the rep performance report
    const report = await t.run(async (ctx) => {
      const reports = await ctx.db
        .query("repPerformanceReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .filter((q) => q.eq(q.field("repId"), "rep1"))
        .collect();

      return reports[0];
    });

    expect(report).not.toBeNull();
    expect(report?.repId).toBe("rep1");
    expect(report?.name).toBe("John Doe");
    expect(report?.sales).toBe(125000);
    expect(report?.battingAvg).toBe(0.28);
    expect(report?.behavior).toBe("Praise");
  });

  test("getRepPerformanceReport logic - returns null for non-existent rep", async () => {
    const t = convexTest(schema);

    // Setup: Create game and company
    const { companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // No reports created
      return { gameId, companyId };
    });

    // Query for non-existent rep
    const report = await t.run(async (ctx) => {
      const reports = await ctx.db
        .query("repPerformanceReports")
        .withIndex("by_company_quarter", (q) =>
          q.eq("companyId", companyId).eq("quarter", 1)
        )
        .filter((q) => q.eq(q.field("repId"), "nonexistent"))
        .collect();

      return reports[0];
    });

    expect(report).toBeNull();
  });
});

describe("Reports Domain - Aggregation Queries", () => {
  test("getReportsByCompany logic - returns all report types for company", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and all report types
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create all three report types
      await ctx.db.insert("hiringOutcomeReports", {
        companyId,
        quarter: 1,
        oldRepOutcomes: [{ repId: "rep1", outcome: "retained" }],
        newRepOutcomes: [{ repId: "rep2", outcome: "hired" }],
      });

      await ctx.db.insert("financialReports", {
        companyId,
        quarter: 1,
        totalRepSalaries: 250000,
        totalCommissions: 50000,
        totalBenefits: 25000,
        totalContestBudget: 10000,
        totalTravel: 5000,
        managerCommission: 10000,
        managerBenefits: 5000,
        trainingExpenses: 3000,
        terminationExpenses: 2000,
        clericalExpenses: 8000,
        rentAndUtilities: 12000,
        legalAndOtherExpenses: 5000,
        marketResearchExpense: 3000,
        totalSales: 500000,
        grossMargin: 250000,
        totalExpenses: 200000,
        netIncome: 50000,
      });

      await ctx.db.insert("repPerformanceReports", {
        companyId,
        quarter: 1,
        repId: "rep1",
        name: "John Doe",
        sales: 125000,
        daysWorked: 60,
        totalCalls: 450,
        battingAvg: 0.28,
        workload: 1.0,
        salary: 50000,
        commission: 12500,
        expenses: 2500,
        contributionMargin: 60000,
        behavior: "Praise",
        marketShare: 15.5,
      });

      return { gameId, companyId };
    });

    // Query all reports for the company
    const reports = await t.run(async (ctx) => {
      const [hiringOutcomes, financials, repPerformance] = await Promise.all([
        ctx.db
          .query("hiringOutcomeReports")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .first(),
        ctx.db
          .query("financialReports")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .first(),
        ctx.db
          .query("repPerformanceReports")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .collect(),
      ]);

      return {
        hiringOutcomes,
        financials,
        repPerformance,
      };
    });

    expect(reports.hiringOutcomes).not.toBeNull();
    expect(reports.financials).not.toBeNull();
    expect(reports.repPerformance).toHaveLength(1);
    expect(reports.financials?.netIncome).toBe(50000);
    expect(reports.repPerformance[0].name).toBe("John Doe");
  });

  test("getReportsByGame logic - returns reports for all companies in game", async () => {
    const t = convexTest(schema);

    // Setup: Create game with multiple companies
    const { gameId, company1Id, company2Id } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 1,
        currentPhase: "hiring",
        length: 4,
        status: "active",
      });

      const company1Id = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      const company2Id = await ctx.db.insert("companies", {
        gameId,
        industry: "B",
        name: "Company B1",
      });

      // Create financial reports for both companies
      await ctx.db.insert("financialReports", {
        companyId: company1Id,
        quarter: 1,
        totalRepSalaries: 250000,
        totalCommissions: 50000,
        totalBenefits: 25000,
        totalContestBudget: 10000,
        totalTravel: 5000,
        managerCommission: 10000,
        managerBenefits: 5000,
        trainingExpenses: 3000,
        terminationExpenses: 2000,
        clericalExpenses: 8000,
        rentAndUtilities: 12000,
        legalAndOtherExpenses: 5000,
        marketResearchExpense: 3000,
        totalSales: 500000,
        grossMargin: 250000,
        totalExpenses: 200000,
        netIncome: 50000,
      });

      await ctx.db.insert("financialReports", {
        companyId: company2Id,
        quarter: 1,
        totalRepSalaries: 240000,
        totalCommissions: 48000,
        totalBenefits: 24000,
        totalContestBudget: 9000,
        totalTravel: 4500,
        managerCommission: 9500,
        managerBenefits: 4750,
        trainingExpenses: 2800,
        terminationExpenses: 1800,
        clericalExpenses: 7500,
        rentAndUtilities: 11500,
        legalAndOtherExpenses: 4500,
        marketResearchExpense: 2800,
        totalSales: 480000,
        grossMargin: 240000,
        totalExpenses: 195000,
        netIncome: 45000,
      });

      return { gameId, company1Id, company2Id };
    });

    // Query reports for the game
    const reports = await t.run(async (ctx) => {
      const companies = await ctx.db
        .query("companies")
        .withIndex("by_game", (q) => q.eq("gameId", gameId))
        .collect();

      return await Promise.all(
        companies.map(async (company) => {
          const financials = await ctx.db
            .query("financialReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id).eq("quarter", 1)
            )
            .first();

          return {
            company,
            financials,
          };
        })
      );
    });

    expect(reports).toHaveLength(2);
    expect(reports[0].financials?.netIncome).toBeDefined();
    expect(reports[1].financials?.netIncome).toBeDefined();
  });

  test("listAllReports logic - returns all reports across all quarters", async () => {
    const t = convexTest(schema);

    // Setup: Create game with reports across multiple quarters
    const { gameId, companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 3,
        currentPhase: "leadership",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create reports for Q1, Q2, and Q3
      for (const quarter of [1, 2, 3]) {
        await ctx.db.insert("financialReports", {
          companyId,
          quarter,
          totalRepSalaries: 250000 + quarter * 10000,
          totalCommissions: 50000 + quarter * 5000,
          totalBenefits: 25000 + quarter * 1000,
          totalContestBudget: 10000,
          totalTravel: 5000,
          managerCommission: 10000,
          managerBenefits: 5000,
          trainingExpenses: 3000,
          terminationExpenses: 2000,
          clericalExpenses: 8000,
          rentAndUtilities: 12000,
          legalAndOtherExpenses: 5000,
          marketResearchExpense: 3000,
          totalSales: 500000 + quarter * 50000,
          grossMargin: 250000 + quarter * 25000,
          totalExpenses: 200000,
          netIncome: 50000 + quarter * 25000,
        });
      }

      return { gameId, companyId };
    });

    // Query all reports for the game
    const reports = await t.run(async (ctx) => {
      const companies = await ctx.db
        .query("companies")
        .withIndex("by_game", (q) => q.eq("gameId", gameId))
        .collect();

      const financials = await Promise.all(
        companies.map((company) =>
          ctx.db
            .query("financialReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", company._id)
            )
            .collect()
        )
      );

      return { companies, financials };
    });

    expect(reports.companies).toHaveLength(1); // One company
    expect(reports.financials[0]).toHaveLength(3); // Three quarters
    expect(reports.financials[0][0].quarter).toBe(1);
    expect(reports.financials[0][1].quarter).toBe(2);
    expect(reports.financials[0][2].quarter).toBe(3);
  });
});

describe("Reports Domain - Quarter Navigation", () => {
  test("navigates between quarters for same company", async () => {
    const t = convexTest(schema);

    // Setup: Create game, company, and reports for Q1-Q4
    const { companyId } = await t.run(async (ctx) => {
      const gameId = await ctx.db.insert("games", {
        name: "Test Game",
        currentQuarter: 4,
        currentPhase: "leadership",
        length: 4,
        status: "active",
      });

      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: "A",
        name: "Company A1",
      });

      // Create hiring outcome reports for all quarters
      for (const quarter of [1, 2, 3, 4]) {
        await ctx.db.insert("hiringOutcomeReports", {
          companyId,
          quarter,
          oldRepOutcomes: [
            { repId: `rep${quarter}_1`, outcome: "retained" },
            { repId: `rep${quarter}_2`, outcome: "poached" },
          ],
          newRepOutcomes: [
            { repId: `rep${quarter}_3`, outcome: "hired" },
            { repId: `rep${quarter}_4`, outcome: "not_hired" },
          ],
        });
      }

      return { gameId, companyId };
    });

    // Query each quarter
    const [q1Report, q2Report, q3Report, q4Report] = await Promise.all(
      [1, 2, 3, 4].map((quarter) =>
        t.run(async (ctx) => {
          return await ctx.db
            .query("hiringOutcomeReports")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", companyId).eq("quarter", quarter)
            )
            .first();
        })
      )
    );

    // Verify each quarter has correct data
    expect(q1Report?.quarter).toBe(1);
    expect(q2Report?.quarter).toBe(2);
    expect(q3Report?.quarter).toBe(3);
    expect(q4Report?.quarter).toBe(4);
    expect(q1Report?.oldRepOutcomes[0].repId).toBe("rep1_1");
    expect(q4Report?.oldRepOutcomes[0].repId).toBe("rep4_1");
  });
});
