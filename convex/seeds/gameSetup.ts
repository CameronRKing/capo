/**
 * Seed Game Setup Data
 *
 * Creates core game infrastructure for E2E testing:
 * - 1 active game (hiring phase, Q1)
 * - 6 companies with different industries
 * - 12 student users (2 per company)
 * - 1 teacher user
 * - 1 admin user
 * - Working hiring decisions for all companies
 * - Submitted hiring decisions for 2 companies
 *
 * Usage: Run this mutation via Convex Dashboard → Functions → seeds → seedGameSetup
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Seed game setup data
 *
 * Creates all core entities needed for E2E testing:
 * - Game with active status
 * - 6 companies across different industries
 * - 14 users (12 students, 1 teacher, 1 admin)
 * - 8 hiring decisions (6 working, 2 submitted)
 *
 * @returns Object with success status and created entity IDs
 */
export const seedGameSetup = mutation({
  args: {},
  handler: async (ctx) => {
    const results: any = {
      game: null,
      companies: [],
      users: [],
      decisions: [],
      errors: [],
    };

    // =====================================================
    // Step 1: Create Active Game
    // =====================================================

    try {
      // Check if game already exists
      const existingGame = await ctx.db
        .query("games")
        .filter((q) => q.eq(q.field("name"), "Test Game"))
        .first();

      if (existingGame) {
        results.game = existingGame._id;
        results.errors.push("Game already exists, using existing");
      } else {
        const gameId = await ctx.db.insert("games", {
          name: "Test Game",
          status: "active",
          currentPhase: "hiring",
          currentQuarter: 1,
          length: 4,
        });
        results.game = gameId;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create game: ${error instanceof Error ? error.message : String(error)}`,
        results,
      };
    }

    // =====================================================
    // Step 2: Create 6 Companies
    // =====================================================

    const industries = [
      "Technology",
      "Healthcare",
      "Finance",
      "Manufacturing",
      "Retail",
      "Energy",
    ];

    for (const industry of industries) {
      try {
        const companyId = await ctx.db.insert("companies", {
          gameId: results.game as any,
          industry,
          name: `${industry} Company`,
        });
        results.companies.push(companyId);
      } catch (error) {
        results.errors.push(`Failed to create ${industry} company: ${error}`);
      }
    }

    if (results.companies.length === 0) {
      return {
        success: false,
        message: "Failed to create any companies",
        results,
      };
    }

    // =====================================================
    // Step 3: Create Users
    // =====================================================

    // Create 12 student users (2 per company)
    let studentIndex = 1;
    for (const companyId of results.companies) {
      for (let i = 0; i < 2; i++) {
        try {
          const userId = await ctx.db.insert("users", {
            email: `student${studentIndex}@test.com`,
            name: `Student ${studentIndex}`,
            role: "student",
            gameId: results.game as any,
            companyId: companyId as any,
          });
          results.users.push(userId);
          studentIndex++;
        } catch (error) {
          results.errors.push(`Failed to create student ${studentIndex}: ${error}`);
        }
      }
    }

    // Create teacher user
    try {
      const teacherId = await ctx.db.insert("users", {
        email: "teacher@test.com",
        name: "Test Teacher",
        role: "teacher",
        gameId: results.game as any,
      });
      results.users.push(teacherId);
    } catch (error) {
      results.errors.push(`Failed to create teacher: ${error}`);
    }

    // Create admin user
    try {
      const adminId = await ctx.db.insert("users", {
        email: "admin@test.com",
        name: "Test Admin",
        role: "admin",
      });
      results.users.push(adminId);
      results.admin = adminId;
    } catch (error) {
      results.errors.push(`Failed to create admin: ${error}`);
    }

    if (results.users.length === 0) {
      return {
        success: false,
        message: "Failed to create any users",
        results,
      };
    }

    // =====================================================
    // Step 4: Create Working Hiring Decisions (Q1)
    // =====================================================

    const defaultHiringDecision = {
      quarter: 1,
      // Compensation
      salary: 50000,
      commission: 5,
      benefits: "bronze" as const,
      travel: "reps_pay_own" as const,
      perDiem: undefined,
      // Sales Contest
      hasSalesContest: false,
      salesContestType: "open" as const,
      salesContestThreshold: 0,
      // Training Time Allocation (sums to 100)
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      // Hiring & Firing
      numberToHire: 0,
      firingList: [],
      // Submission Tracking
      isSubmitted: false,
      submittedBy: undefined,
      submittedAt: undefined,
    };

    // Create working decisions for all 6 companies
    for (const companyId of results.companies) {
      try {
        const decisionId = await ctx.db.insert("hiringDecisions", {
          companyId: companyId as any,
          ...defaultHiringDecision,
        });
        results.decisions.push(decisionId);
      } catch (error) {
        results.errors.push(`Failed to create hiring decision for company: ${error}`);
      }
    }

    // =====================================================
    // Step 5: Create Submitted Hiring Decisions (2 companies)
    // =====================================================

    // Get first student from each of first 2 companies for submission
    const studentUsers = results.users.slice(0, 4); // First 4 are students (2 per company)
    const submittedDecisionCompanies = results.companies.slice(0, 2);

    let studentIndexForSubmit = 0;
    for (const companyId of submittedDecisionCompanies) {
      try {
        const decisionId = await ctx.db.insert("hiringDecisions", {
          companyId: companyId as any,
          ...defaultHiringDecision,
          isSubmitted: true,
          submittedBy: studentUsers[studentIndexForSubmit] as any,
          submittedAt: Date.now(),
        });
        results.decisions.push(decisionId);
        studentIndexForSubmit += 2; // Skip to next company's student
      } catch (error) {
        results.errors.push(`Failed to create submitted hiring decision: ${error}`);
      }
    }

    // =====================================================
    // Return Results
    // =====================================================

    return {
      success: true,
      message: "Game setup seeded successfully",
      results: {
        gameId: results.game,
        companyIds: results.companies,
        userIds: results.users,
        decisionIds: results.decisions,
        adminId: results.admin,
        errorCount: results.errors.length,
        errors: results.errors,
      },
    };
  },
});

/**
 * Rollback game setup data
 *
 * Deletes all entities created by seedGameSetup.
 * WARNING: This will delete ALL games, companies, users, and hiring decisions.
 *
 * @returns Object with success status and deletion counts
 */
export const rollbackGameSetup = mutation({
  args: {},
  handler: async (ctx) => {
    let deletedDecisions = 0;
    let deletedUsers = 0;
    let deletedCompanies = 0;
    let deletedGames = 0;

    // Delete all hiring decisions
    const decisions = await ctx.db.query("hiringDecisions").collect();
    for (const decision of decisions) {
      await ctx.db.delete(decision._id);
      deletedDecisions++;
    }

    // Delete all users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
      deletedUsers++;
    }

    // Delete all companies
    const companies = await ctx.db.query("companies").collect();
    for (const company of companies) {
      await ctx.db.delete(company._id);
      deletedCompanies++;
    }

    // Delete all games
    const games = await ctx.db.query("games").collect();
    for (const game of games) {
      await ctx.db.delete(game._id);
      deletedGames++;
    }

    return {
      success: true,
      message: "Game setup rolled back successfully",
      results: {
        deletedDecisions,
        deletedUsers,
        deletedCompanies,
        deletedGames,
      },
    };
  },
});
