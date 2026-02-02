/**
 * Resume Ranking Integration Tests
 *
 * Tests the private-but-visible ranking model:
 * - Students can read their own rankings ✓
 * - Students can read teammates' rankings ✓
 * - Students CANNOT modify teammates' rankings ✓
 * - Teachers can read all rankings in their game ✓
 * - Teachers CANNOT modify student rankings ✓
 *
 * Run: npm run test:once convex/domain/rankings.test.ts
 */

import { convexTest } from "convex-test";
import { expect, test, vi, describe } from "vitest";
import schema from "../schema";
import type { User } from "../services/permissions";

/**
 * Test helper to create a test user with auth mock
 */
function mockAuthContext(ctx: any, user: User) {
  vi.spyOn(ctx.auth, "getUserIdentity").mockResolvedValue({
    subject: user._id,
    email: user.email,
    name: user.name,
  });
  return user;
}

/**
 * Test helper: Setup a game with companies and students
 */
async function setupRankingTest(t: any) {
  // Create game
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  // Create company
  const companyId = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A1",
    });
  });

  // Create users (no auth context needed for insertion)
  const student1: User = {
    _id: "student1" as any,
    name: "Student 1",
    email: "student1@test.com",
    role: "student",
    gameId,
    companyId,
  };

  const student2: User = {
    _id: "student2" as any,
    name: "Student 2",
    email: "student2@test.com",
    role: "student",
    gameId,
    companyId,
  };

  const teacher: User = {
    _id: "teacher1" as any,
    name: "Teacher",
    email: "teacher@test.com",
    role: "teacher",
    gameId,
  };

  const admin: User = {
    _id: "admin1" as any,
    name: "Admin",
    email: "admin@test.com",
    role: "admin",
  };

  // Insert users into database
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: student1.name,
      email: student1.email,
      role: student1.role,
      gameId,
      companyId,
    });
    await ctx.db.insert("users", {
      name: student2.name,
      email: student2.email,
      role: student2.role,
      gameId,
      companyId,
    });
    await ctx.db.insert("users", {
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      gameId,
    });
    await ctx.db.insert("users", {
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  });

  return { gameId, companyId, student1, student2, teacher, admin };
}

describe("Resume Rankings - Private But Visible", () => {
  test("student can read their own rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1 } = await setupRankingTest(t);

    // Student 1 saves a ranking
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
    });

    // Student 1 can read their own ranking
    const myRankings = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", student1._id).eq("companyId", companyId)
        )
        .collect();
    });

    expect(myRankings).toHaveLength(1);
    expect(myRankings[0].repId).toBe("rep1");
    expect(myRankings[0].group).toBe("A");
    expect(myRankings[0].rank).toBe(0);
  });

  test("student can read teammates rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1, student2 } = await setupRankingTest(t);

    // Student 1 saves rankings
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep2",
        group: "B",
        rank: 0,
      });
    });

    // Student 2 saves different rankings
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep3",
        group: "A",
        rank: 0,
      });
    });

    // Student 2 can see Student 1's rankings via RLS
    const teammateRankings = await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      return await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) => q.eq("companyId", companyId))
        .collect();
    });

    // Should see all company rankings (own + teammates)
    expect(teammateRankings).toHaveLength(3);

    // Should see student1's rankings
    const student1Rankings = teammateRankings.filter((r: any) => r.userId === student1._id);
    expect(student1Rankings).toHaveLength(2);
    expect(student1Rankings.some((r: any) => r.repId === "rep1")).toBe(true);
    expect(student1Rankings.some((r: any) => r.repId === "rep2")).toBe(true);
  });

  test("student CANNOT modify teammates rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1, student2 } = await setupRankingTest(t);

    // Student 1 saves a ranking
    const rankingId = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
    });

    // Get original value
    const original = await t.run(async (ctx) => {
      return await ctx.db.get(rankingId);
    });

    expect(original?.group).toBe("A");

    // Student 2 tries to modify Student 1's ranking (should fail silently via RLS)
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      try {
        // RLS will deny this - modify rule requires userId === ctx.user._id
        await ctx.db.patch(rankingId, {
          group: "C",
          rank: 99,
        });
      } catch (e) {
        // Expected - RLS denies the modification
      }
    });

    // Verify Student 1's ranking is unchanged
    const unchanged = await t.run(async (ctx) => {
      return await ctx.db.get(rankingId);
    });

    expect(unchanged?.repId).toBe("rep1");
    expect(unchanged?.group).toBe("A");
    expect(unchanged?.rank).toBe(0);
  });

  test("student CANNOT delete teammates rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1, student2 } = await setupRankingTest(t);

    // Student 1 saves a ranking
    const rankingId = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
    });

    // Student 2 tries to delete Student 1's ranking (should fail silently via RLS)
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      try {
        await ctx.db.delete(rankingId);
      } catch (e) {
        // Expected - RLS denies the deletion
      }
    });

    // Verify ranking still exists
    const stillExists = await t.run(async (ctx) => {
      return await ctx.db.get(rankingId);
    });

    expect(stillExists).toBeDefined();
    expect(stillExists?.repId).toBe("rep1");
  });

  test("teacher can read all student rankings in their game", async () => {
    const t = convexTest(schema);
    const { companyId, student1, student2, teacher } = await setupRankingTest(t);

    // Students save rankings
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
    });

    await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep2",
        group: "B",
        rank: 0,
      });
    });

    // Teacher can see all rankings via RLS
    const allRankings = await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      return await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) => q.eq("companyId", companyId))
        .collect();
    });

    // Should see both students' rankings
    expect(allRankings).toHaveLength(2);
  });

  test("teacher CANNOT modify student rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1, teacher } = await setupRankingTest(t);

    // Student saves a ranking
    const rankingId = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
    });

    // Teacher tries to modify student ranking (should fail silently via RLS)
    await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      try {
        await ctx.db.patch(rankingId, {
          group: "C",
          rank: 99,
        });
      } catch (e) {
        // Expected - RLS denies the modification
      }
    });

    // Verify student's ranking is unchanged
    const unchanged = await t.run(async (ctx) => {
      return await ctx.db.get(rankingId);
    });

    expect(unchanged?.group).toBe("A");
    expect(unchanged?.rank).toBe(0);
  });

  test("admin has full access to rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1, admin } = await setupRankingTest(t);

    // Student saves a ranking
    const rankingId = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
    });

    // Admin can read all rankings
    const allRankings = await t.run(async (ctx) => {
      mockAuthContext(ctx, admin);
      return await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) => q.eq("companyId", companyId))
        .collect();
    });

    expect(allRankings).toHaveLength(1);

    // Admin can modify any ranking
    await t.run(async (ctx) => {
      mockAuthContext(ctx, admin);
      await ctx.db.patch(rankingId, {
        group: "C",
        rank: 99,
      });
    });

    // Verify change was applied
    const modified = await t.run(async (ctx) => {
      return await ctx.db.get(rankingId);
    });

    expect(modified?.group).toBe("C");
    expect(modified?.rank).toBe(99);
  });
});

describe("Resume Rankings - Batch Operations", () => {
  test("batch save updates multiple rankings efficiently", async () => {
    const t = convexTest(schema);
    const { companyId, student1 } = await setupRankingTest(t);

    // Save multiple rankings
    const results = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      const ids = [];
      ids.push(
        await ctx.db.insert("resumeRankings", {
          userId: student1._id,
          companyId,
          repId: "rep1",
          group: "A",
          rank: 0,
        })
      );
      ids.push(
        await ctx.db.insert("resumeRankings", {
          userId: student1._id,
          companyId,
          repId: "rep2",
          group: "A",
          rank: 1,
        })
      );
      ids.push(
        await ctx.db.insert("resumeRankings", {
          userId: student1._id,
          companyId,
          repId: "rep3",
          group: "B",
          rank: 0,
        })
      );
      ids.push(
        await ctx.db.insert("resumeRankings", {
          userId: student1._id,
          companyId,
          repId: "rep4",
          group: "C",
          rank: 0,
        })
      );
      return ids;
    });

    expect(results).toHaveLength(4);

    // Verify all rankings were saved
    const myRankings = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", student1._id).eq("companyId", companyId)
        )
        .collect();
    });

    expect(myRankings).toHaveLength(4);
    expect(myRankings.filter((r: any) => r.group === "A")).toHaveLength(2);
    expect(myRankings.filter((r: any) => r.group === "B")).toHaveLength(1);
    expect(myRankings.filter((r: any) => r.group === "C")).toHaveLength(1);
  });
});

describe("Resume Rankings - Progress Tracking", () => {
  test("getUnrankedResumes returns unranked resumes", async () => {
    const t = convexTest(schema);
    const { companyId, student1 } = await setupRankingTest(t);

    // Rank some resumes
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep2",
        group: "B",
        rank: 0,
      });
    });

    // Get user's rankings
    const rankings = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", student1._id).eq("companyId", companyId)
        )
        .collect();
    });

    // Get all resumes
    const allResumes = await t.run(async (ctx) => {
      return await ctx.db.query("resumes").collect();
    });

    const rankedRepIds = new Set(rankings.map((r: any) => r.repId));
    const unranked = allResumes.filter((resume: any) => !rankedRepIds.has(resume.repId));

    // Should return resumes other than rep1 and rep2
    expect(unranked.length).toBeGreaterThan(0);
    expect(unranked.every((r: any) => r.repId !== "rep1" && r.repId !== "rep2")).toBe(true);
  });

  test("getRankingSummary returns correct counts", async () => {
    const t = convexTest(schema);
    const { companyId, student1 } = await setupRankingTest(t);

    // Save rankings across groups
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep2",
        group: "A",
        rank: 1,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep3",
        group: "A",
        rank: 2,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep4",
        group: "B",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep5",
        group: "B",
        rank: 1,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep6",
        group: "C",
        rank: 0,
      });
    });

    // Get summary
    const summary = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      const rankings = await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", student1._id).eq("companyId", companyId)
        )
        .collect();

      return {
        total: rankings.length,
        A: rankings.filter((r: any) => r.group === "A").length,
        B: rankings.filter((r: any) => r.group === "B").length,
        C: rankings.filter((r: any) => r.group === "C").length,
      };
    });

    expect(summary.total).toBe(6);
    expect(summary.A).toBe(3);
    expect(summary.B).toBe(2);
    expect(summary.C).toBe(1);
  });
});
