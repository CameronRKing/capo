/**
 * Seed Rankings and Territory Data
 *
 * Creates rankings and territory assignment data for E2E testing:
 * - Resume rankings for all students (groups A/B/C)
 * - Hiring lists (Q1) per company
 * - Active reps (5-10 per company, Q1)
 * - Territory assignments (all 88 counties distributed)
 *
 * Usage: Run this mutation via Convex Dashboard → Functions → seeds → seedRankingsData
 *
 * IMPORTANT: Run seedGameSetup first to create game, companies, and users
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { RESUMES } from "../services/seedData/resumes";
import { COUNTIES } from "../services/seedData/counties";

/**
 * Seed rankings and territory data
 *
 * Creates:
 * - Resume rankings for each student (20-30 resumes each)
 * - Combined hiring lists per company
 * - Active reps with territory assignments
 * - Territory assignments for all 88 counties
 *
 * @param gameId - Game ID (from seedGameSetup)
 * @param companyIds - Array of company IDs (from seedGameSetup)
 * @param userIds - Array of user IDs (from seedGameSetup)
 * @returns Object with success status and creation counts
 */
export const seedRankingsData = mutation({
  args: {
    gameId: v.id("games"),
    companyIds: v.array(v.id("companies")),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const results: any = {
      rankings: [],
      hiringLists: [],
      activeReps: [],
      territoryAssignments: [],
      errors: [],
    };

    // =====================================================
    // Step 1: Filter Students by Company
    // =====================================================

    const studentsByCompany: Map<string, any[]> = new Map();

    for (const companyId of args.companyIds) {
      studentsByCompany.set(companyId, []);
    }

    // Group students by their company assignment
    for (const userId of args.userIds) {
      try {
        const user = await ctx.db.get(userId);
        if (!user) continue;
        if (user.role !== "student") continue;
        if (!user.companyId) continue;

        const companyStudents = studentsByCompany.get(user.companyId.toString());
        if (companyStudents) {
          companyStudents.push(user);
        }
      } catch (error) {
        results.errors.push(`Failed to fetch user ${userId}: ${error}`);
      }
    }

    // =====================================================
    // Step 2: Create Resume Rankings per Student
    // =====================================================

    // Create rankings for each student
    for (const [companyId, students] of studentsByCompany.entries()) {
      for (const student of students) {
        // Each student ranks 20-30 resumes
        const resumesToRank = 20 + Math.floor(Math.random() * 11);

        // Distribute resumes across groups A, B, C
        const groupA = Math.floor(resumesToRank * 0.3); // Top 30%
        const groupB = Math.floor(resumesToRank * 0.4); // Middle 40%
        const groupC = resumesToRank - groupA - groupB; // Bottom 30%

        let rankIndex = 1;

        // Group A (top tier)
        for (let i = 0; i < groupA; i++) {
          const resumeIndex = (rankIndex - 1) % RESUMES.length;
          try {
            const rankingId = await ctx.db.insert("resumeRankings", {
              userId: student._id,
              companyId: companyId as any,
              repId: RESUMES[resumeIndex].repId,
              group: "A",
              rank: rankIndex,
            });
            results.rankings.push(rankingId);
            rankIndex++;
          } catch (error) {
            results.errors.push(`Failed to create ranking: ${error}`);
          }
        }

        // Reset rank for group B
        rankIndex = 1;

        // Group B (middle tier)
        for (let i = 0; i < groupB; i++) {
          const resumeIndex = ((groupA + i) % RESUMES.length);
          try {
            const rankingId = await ctx.db.insert("resumeRankings", {
              userId: student._id,
              companyId: companyId as any,
              repId: RESUMES[resumeIndex].repId,
              group: "B",
              rank: rankIndex,
            });
            results.rankings.push(rankingId);
            rankIndex++;
          } catch (error) {
            results.errors.push(`Failed to create ranking: ${error}`);
          }
        }

        // Reset rank for group C
        rankIndex = 1;

        // Group C (bottom tier)
        for (let i = 0; i < groupC; i++) {
          const resumeIndex = ((groupA + groupB + i) % RESUMES.length);
          try {
            const rankingId = await ctx.db.insert("resumeRankings", {
              userId: student._id,
              companyId: companyId as any,
              repId: RESUMES[resumeIndex].repId,
              group: "C",
              rank: rankIndex,
            });
            results.rankings.push(rankingId);
            rankIndex++;
          } catch (error) {
            results.errors.push(`Failed to create ranking: ${error}`);
          }
        }
      }
    }

    // =====================================================
    // Step 3: Create Hiring Lists (Q1) per Company
    // =====================================================

    for (const companyId of args.companyIds) {
      try {
        // Combine all resumes into ordered list
        // In real scenario, this would aggregate all students' rankings
        // For seeding, we'll use first 30 resumes in order
        const repIds = RESUMES.slice(0, 30).map((r) => r.repId);

        const hiringListId = await ctx.db.insert("hiringLists", {
          companyId: companyId as any,
          quarter: 1,
          repIds,
        });
        results.hiringLists.push(hiringListId);
      } catch (error) {
        results.errors.push(`Failed to create hiring list for company ${companyId}: ${error}`);
      }
    }

    // =====================================================
    // Step 4: Create Active Reps (Q1) per Company
    // =====================================================

    // Assign 5-10 reps per company
    for (const companyId of args.companyIds) {
      const repCount = 5 + Math.floor(Math.random() * 6); // 5-10 reps

      for (let i = 0; i < repCount; i++) {
        const resumeIndex = (i * 5) % RESUMES.length; // Spread out resumes

        // Assign 5-10 counties to each rep
        const territoryCount = 5 + Math.floor(Math.random() * 6);
        const territories: number[] = [];
        for (let j = 0; j < territoryCount; j++) {
          const countyIndex = ((i * 10 + j) % COUNTIES.length);
          territories.push(COUNTIES[countyIndex].id);
        }

        try {
          const activeRepId = await ctx.db.insert("activeReps", {
            companyId: companyId as any,
            quarter: 1,
            repId: RESUMES[resumeIndex].repId,
            willLetGo: false,
            individualHours: 160,
            leadershipBehavior: "Support",
            territories,
            sales: undefined, // Will be computed after compilation
            performance: undefined,
            marketShare: undefined,
          });
          results.activeReps.push(activeRepId);
        } catch (error) {
          results.errors.push(`Failed to create active rep: ${error}`);
        }
      }
    }

    // =====================================================
    // Step 5: Create Territory Assignments (Q1)
    // =====================================================

    // Distribute all 88 counties across all companies
    let countyIndex = 0;
    const countiesPerCompany = Math.ceil(COUNTIES.length / args.companyIds.length);

    for (const companyId of args.companyIds) {
      const assignments: any[] = [];

      // Get all active reps for this company
      const companyReps = results.activeReps.filter(async (id: any) => {
        const rep = await ctx.db.get(id);
        return rep?.companyId === companyId;
      });

      // Assign counties to reps
      for (let i = 0; i < countiesPerCompany && countyIndex < COUNTIES.length; i++) {
        const county = COUNTIES[countyIndex];
        const repIndex = i % companyReps.length;

        // Get repId from activeReps record
        const repRecord = await ctx.db.get(companyReps[repIndex]);
        if (!repRecord) continue;

        assignments.push({
          countyId: county.id,
          repId: repRecord.repId,
        });

        countyIndex++;
      }

      try {
        const territoryAssignmentId = await ctx.db.insert("territories", {
          companyId: companyId as any,
          quarter: 1,
          assignments,
          isSubmitted: true,
          submittedBy: args.userIds[0] as any, // First user (likely admin or teacher)
          submittedAt: Date.now(),
        });
        results.territoryAssignments.push(territoryAssignmentId);
      } catch (error) {
        results.errors.push(`Failed to create territory assignment: ${error}`);
      }
    }

    // =====================================================
    // Return Results
    // =====================================================

    return {
      success: true,
      message: "Rankings and territory data seeded successfully",
      results: {
        rankingCount: results.rankings.length,
        hiringListCount: results.hiringLists.length,
        activeRepCount: results.activeReps.length,
        territoryAssignmentCount: results.territoryAssignments.length,
        errorCount: results.errors.length,
        errors: results.errors,
      },
    };
  },
});

/**
 * Rollback rankings and territory data
 *
 * Deletes all rankings, hiring lists, active reps, and territory assignments.
 *
 * @returns Object with success status and deletion counts
 */
export const rollbackRankingsData = mutation({
  args: {},
  handler: async (ctx) => {
    let deletedRankings = 0;
    let deletedHiringLists = 0;
    let deletedActiveReps = 0;
    let deletedTerritories = 0;

    // Delete all resume rankings
    const rankings = await ctx.db.query("resumeRankings").collect();
    for (const ranking of rankings) {
      await ctx.db.delete(ranking._id);
      deletedRankings++;
    }

    // Delete all hiring lists
    const hiringLists = await ctx.db.query("hiringLists").collect();
    for (const list of hiringLists) {
      await ctx.db.delete(list._id);
      deletedHiringLists++;
    }

    // Delete all active reps
    const activeReps = await ctx.db.query("activeReps").collect();
    for (const rep of activeReps) {
      await ctx.db.delete(rep._id);
      deletedActiveReps++;
    }

    // Delete all territory assignments
    const territories = await ctx.db.query("territories").collect();
    for (const territory of territories) {
      await ctx.db.delete(territory._id);
      deletedTerritories++;
    }

    return {
      success: true,
      message: "Rankings and territory data rolled back successfully",
      results: {
        deletedRankings,
        deletedHiringLists,
        deletedActiveReps,
        deletedTerritories,
      },
    };
  },
});
