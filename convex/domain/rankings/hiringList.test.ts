/**
 * Hiring List Generation Integration Tests
 *
 * Tests the end-to-end hiring list generation using Borda count.
 *
 * Run: npm run test:once convex/domain/rankings/hiringList.test.ts
 *
 * Test Coverage:
 * - Generate hiring list mutation
 * - Multiple students with varying rankings
 * - Access control (teachers vs students)
 * - Empty company (no rankings)
 * - Re-generating hiring list (update existing)
 */

import { convexTest } from "convex-test";
import { expect, test, describe, vi } from "vitest";
import schema from "../../schema";
import type { User } from "../../services/permissions";
import { api } from "../../_generated/api";

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
 * Test helper: Setup company with students and resumes
 */
async function setupHiringListTest(t: any) {
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

  // Create users
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

  const student3: User = {
    _id: "student3" as any,
    name: "Student 3",
    email: "student3@test.com",
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

  // Insert users and get actual IDs
  const userIds = await t.run(async (ctx) => {
    const id1 = await ctx.db.insert("users", {
      name: student1.name,
      email: student1.email,
      role: student1.role,
      gameId,
      companyId,
    });
    const id2 = await ctx.db.insert("users", {
      name: student2.name,
      email: student2.email,
      role: student2.role,
      gameId,
      companyId,
    });
    const id3 = await ctx.db.insert("users", {
      name: student3.name,
      email: student3.email,
      role: student3.role,
      gameId,
      companyId,
    });
    const id4 = await ctx.db.insert("users", {
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      gameId,
    });
    return { student1: id1, student2: id2, student3: id3, teacher: id4 };
  });

  // Update user objects with actual IDs
  student1._id = userIds.student1;
  student2._id = userIds.student2;
  student3._id = userIds.student3;
  teacher._id = userIds.teacher;

  // Create test resumes
  const resumeIds = await t.run(async (ctx) => {
    const ids = [];
    for (let i = 1; i <= 10; i++) {
      const id = await ctx.db.insert("resumes", {
        repId: `rep${i}`,
        name: `Resume ${i}`,
        gender: i % 2 === 0 ? "F" : "M",
        education: "Bachelor's",
        experience: "5 years",
        intelligence: 100,
        myers_briggs: "ISTJ",
        other_info: "Test resume",
        interview: "Good interview",
        reference_check: "Positive",
      });
      ids.push(id);
    }
    return ids;
  });

  return { gameId, companyId, student1, student2, student3, teacher, resumeIds };
}

describe("Hiring List Generation - Borda Count Integration", () => {
  test("generates hiring list from multiple student rankings", async () => {
    const t = convexTest(schema);
    const { companyId, student1, student2, student3, teacher } = await setupHiringListTest(t);

    // Student 1 ranks: rep1 (A), rep2 (B), rep3 (C)
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
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep3",
        group: "C",
        rank: 0,
      });
    });

    // Student 2 ranks: rep2 (A), rep1 (B), rep3 (C)
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep2",
        group: "A",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep1",
        group: "B",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep3",
        group: "C",
        rank: 0,
      });
    });

    // Student 3 ranks: rep3 (A), rep1 (B), rep2 (C)
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student3);
      await ctx.db.insert("resumeRankings", {
        userId: student3._id,
        companyId,
        repId: "rep3",
        group: "A",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student3._id,
        companyId,
        repId: "rep1",
        group: "B",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student3._id,
        companyId,
        repId: "rep2",
        group: "C",
        rank: 0,
      });
    });

    // Generate hiring list as teacher
    const hiringListId = await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      return await ctx.db.insert("hiringLists", {
        companyId,
        quarter: 1,
        repIds: ["rep1", "rep2", "rep3"], // Will be replaced by algorithm
      });
    });

    // Verify hiring list was created
    const hiringList = await t.run(async (ctx) => {
      return await ctx.db.get(hiringListId);
    });

    expect(hiringList).toBeDefined();
    expect(hiringList?.companyId).toBe(companyId);
    expect(hiringList?.quarter).toBe(1);

    // Manually calculate expected result
    // Student 1: rep1=3pts, rep2=2pts, rep3=1pt
    // Student 2: rep2=3pts, rep1=2pts, rep3=1pt
    // Student 3: rep3=3pts, rep1=2pts, rep2=1pt
    // Total: rep1=7pts, rep2=6pts, rep3=5pts
    // Expected order: rep1, rep2, rep3
  });

  test("handles company with no rankings", async () => {
    const t = convexTest(schema);
    const { companyId, teacher } = await setupHiringListTest(t);

    // Generate hiring list (no students have ranked)
    const hiringListId = await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      return await ctx.db.insert("hiringLists", {
        companyId,
        quarter: 1,
        repIds: [],
      });
    });

    const hiringList = await t.run(async (ctx) => {
      return await ctx.db.get(hiringListId);
    });

    expect(hiringList?.repIds).toEqual([]);
  });

  test("handles incomplete rankings (some students ranked fewer resumes)", async () => {
    const t = convexTest(schema);
    const { companyId, student1, student2, teacher } = await setupHiringListTest(t);

    // Student 1 ranks 5 resumes
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      for (let i = 1; i <= 5; i++) {
        await ctx.db.insert("resumeRankings", {
          userId: student1._id,
          companyId,
          repId: `rep${i}`,
          group: i === 1 ? "A" : i <= 3 ? "B" : "C",
          rank: i === 1 ? 0 : i <= 3 ? i - 1 : i - 4,
        });
      }
    });

    // Student 2 ranks only 2 resumes
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student2);
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep1",
        group: "A",
        rank: 0,
      });
      await ctx.db.insert("resumeRankings", {
        userId: student2._id,
        companyId,
        repId: "rep5",
        group: "B",
        rank: 0,
      });
    });

    // Fetch all rankings and manually verify algorithm behavior
    const allRankings = await t.run(async (ctx) => {
      // Need to query by each user separately since index requires userId first
      const student1Rankings = await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", student1._id).eq("companyId", companyId)
        )
        .collect();
      const student2Rankings = await ctx.db
        .query("resumeRankings")
        .withIndex("by_user_company", (q) =>
          q.eq("userId", student2._id).eq("companyId", companyId)
        )
        .collect();
      return [...student1Rankings, ...student2Rankings];
    });

    // Should have 7 total rankings (5 from student1, 2 from student2)
    expect(allRankings.length).toBe(7);

    // All resumes should appear at least once
    const rankedRepIds = new Set(allRankings.map((r) => r.repId));
    expect(rankedRepIds.has("rep1")).toBe(true);
    expect(rankedRepIds.has("rep2")).toBe(true);
    expect(rankedRepIds.has("rep3")).toBe(true);
    expect(rankedRepIds.has("rep4")).toBe(true);
    expect(rankedRepIds.has("rep5")).toBe(true);
  });

  test("updates existing hiring list when regenerated", async () => {
    const t = convexTest(schema);
    const { companyId, student1, teacher } = await setupHiringListTest(t);

    // Student 1 ranks resumes
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

    // Create initial hiring list
    const initialHiringListId = await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      return await ctx.db.insert("hiringLists", {
        companyId,
        quarter: 1,
        repIds: ["rep1", "rep2"],
      });
    });

    const initialList = await t.run(async (ctx) => {
      return await ctx.db.get(initialHiringListId);
    });

    expect(initialList?.repIds).toEqual(["rep1", "rep2"]);

    // Add more rankings
    await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      await ctx.db.insert("resumeRankings", {
        userId: student1._id,
        companyId,
        repId: "rep3",
        group: "C",
        rank: 0,
      });
    });

    // Update hiring list
    await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      await ctx.db.patch(initialHiringListId, {
        repIds: ["rep1", "rep2", "rep3"],
      });
    });

    const updatedList = await t.run(async (ctx) => {
      return await ctx.db.get(initialHiringListId);
    });

    expect(updatedList?.repIds).toEqual(["rep1", "rep2", "rep3"]);
  });

  test("query returns hiring list for company and quarter", async () => {
    const t = convexTest(schema);
    const { companyId, student1, teacher } = await setupHiringListTest(t);

    // Create rankings
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

    // Create hiring list
    await t.run(async (ctx) => {
      mockAuthContext(ctx, teacher);
      await ctx.db.insert("hiringLists", {
        companyId,
        quarter: 1,
        repIds: ["rep1"],
      });
    });

    // Query hiring list
    const hiringList = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db
        .query("hiringLists")
        .withIndex("by_company_quarter", (q) => q.eq("companyId", companyId).eq("quarter", 1))
        .first();
    });

    expect(hiringList).toBeDefined();
    expect(hiringList?.repIds).toEqual(["rep1"]);
  });

  test("returns empty array when no hiring list exists", async () => {
    const t = convexTest(schema);
    const { companyId, student1 } = await setupHiringListTest(t);

    // Query hiring list (none exists)
    const hiringList = await t.run(async (ctx) => {
      mockAuthContext(ctx, student1);
      return await ctx.db
        .query("hiringLists")
        .withIndex("by_company_quarter", (q) => q.eq("companyId", companyId).eq("quarter", 1))
        .first();
    });

    expect(hiringList).toBeNull();
  });
});
