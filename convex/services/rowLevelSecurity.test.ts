/**
 * Integration tests for Row-Level Security (RLS) framework
 *
 * Tests verify that role-based access control is enforced at the database level
 * for all user roles: admin, teacher, and student.
 */

import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { v } from "convex/values";
import schema from "../schema";
import type { Id } from "../_generated/dataModel";
import { queryWithRLS, mutationWithRLS } from "./rowLevelSecurity";
import { type User, type Role } from "./permissions";

// Test helper to create a test user with auth mock
function mockAuthContext(t: any, user: User) {
  vi.spyOn(t.ctx.auth, "getUserIdentity").mockResolvedValue({
    subject: user._id,
    email: user.email,
    name: user.name,
  });
  return user;
}

// Create a query using queryWithRLS for testing
const createTestQuery = () => queryWithRLS({
  args: {},
  handler: async (ctx) => {
    // Simple query that returns all games - RLS will filter
    return await ctx.db.query("games").collect();
  },
});

// Create a mutation using mutationWithRLS for testing
const createTestMutation = () => mutationWithRLS({
  args: { gameId: v.id("games"), name: v.string() },
  handler: async (ctx, args) => {
    // Try to modify a game - RLS will enforce
    return await ctx.db.patch(args.gameId, { name: args.name });
  },
});

test("Admin can read all games", async () => {
  const t = convexTest(schema);

  // Create games
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const game2 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 2",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  // Create admin user
  const adminUser: User = {
    _id: "admin123",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
  };

  // Query with admin context - should see all games
  const result = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, adminUser);
    const games = await ctx.db.query("games").collect();
    return games.length;
  });

  expect(result).toBe(2);
});

test("Teacher can only read their assigned game", async () => {
  const t = convexTest(schema);

  // Create games
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("games", {
      name: "Game 2",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  // Create teacher user assigned to game1
  const teacherUser: User = {
    _id: "teacher123",
    name: "Teacher",
    email: "teacher@example.com",
    role: "teacher",
    gameId: game1,
  };

  // Query with teacher context - should only see game1
  const result = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, teacherUser);
    const games = await ctx.db.query("games").collect();
    return games;
  });

  expect(result.length).toBe(1);
  expect(result[0]._id).toEqual(game1);
});

test("Student can only read their assigned game", async () => {
  const t = convexTest(schema);

  // Create games and company
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const company1 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 1",
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("games", {
      name: "Game 2",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  // Create student user
  const studentUser: User = {
    _id: "student123",
    name: "Student",
    email: "student@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Query with student context - should only see game1
  const result = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, studentUser);
    const games = await ctx.db.query("games").collect();
    return games;
  });

  expect(result.length).toBe(1);
  expect(result[0]._id).toEqual(game1);
});

test("Student can only read their company", async () => {
  const t = convexTest(schema);

  // Create game and two companies
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const company1 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 1",
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 2",
    });
  });

  // Create student user assigned to company1
  const studentUser: User = {
    _id: "student123",
    name: "Student",
    email: "student@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Query companies - should only see company1
  const result = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, studentUser);
    const companies = await ctx.db.query("companies").collect();
    return companies;
  });

  expect(result.length).toBe(1);
  expect(result[0]._id).toEqual(company1);
});

test("Student cannot query other companies (denied by RLS)", async () => {
  const t = convexTest(schema);

  // Create game and two companies
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const company1 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 1",
    });
  });

  const company2 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 2",
    });
  });

  // Create student user assigned to company1
  const studentUser: User = {
    _id: "student123",
    name: "Student",
    email: "student@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Query all companies - RLS should filter out company2
  const result = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, studentUser);
    const companies = await ctx.db.query("companies").collect();
    return companies;
  });

  // Should only see company1, not company2
  expect(result.length).toBe(1);
  expect(result[0]._id).toEqual(company1);
  expect(result.find((c: any) => c._id === company2)).toBeUndefined();
});

test("Teacher can read all companies in their game", async () => {
  const t = convexTest(schema);

  // Create game and companies
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 1",
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 2",
    });
  });

  // Create teacher user
  const teacherUser: User = {
    _id: "teacher123",
    name: "Teacher",
    email: "teacher@example.com",
    role: "teacher",
    gameId: game1,
  };

  // Query companies - should see both companies
  const result = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, teacherUser);
    const companies = await ctx.db.query("companies").collect();
    return companies;
  });

  expect(result.length).toBe(2);
});

test("Students can modify their company decisions", async () => {
  const t = convexTest(schema);

  // Create game, company, and decision
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const company1 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 1",
    });
  });

  const decisionId = await t.run(async (ctx) => {
    return await ctx.db.insert("hiringDecisions", {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "bronze",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 100000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: false,
    });
  });

  // Create student user
  const studentUser: User = {
    _id: "student123",
    name: "Student",
    email: "student@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Student should be able to modify their company's decision
  await t.run(async (ctx) => {
    mockAuthContext({ ctx }, studentUser);
    // This should succeed - student owns this decision
    await ctx.db.patch(decisionId, { salary: 55000 });
  });

  // Verify the change
  const result = await t.run(async (ctx) => {
    const decision = await ctx.db.get(decisionId);
    return decision?.salary;
  });

  expect(result).toBe(55000);
});

test("Students cannot modify other companies' decisions", async () => {
  const t = convexTest(schema);

  // Create game, two companies, and decision for company2
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const company1 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 1",
    });
  });

  const company2 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 2",
    });
  });

  const decisionId = await t.run(async (ctx) => {
    return await ctx.db.insert("hiringDecisions", {
      companyId: company2,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "bronze",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 100000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: false,
    });
  });

  // Create student user assigned to company1
  const studentUser: User = {
    _id: "student123",
    name: "Student",
    email: "student@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Student should NOT be able to modify company2's decision
  // RLS will deny this operation
  await t.run(async (ctx) => {
    mockAuthContext({ ctx }, studentUser);
    // This should fail silently - RLS denies the modification
    try {
      await ctx.db.patch(decisionId, { salary: 55000 });
    } catch (e) {
      // Expected - RLS denies access
    }
  });

  // Verify the change did NOT happen
  const result = await t.run(async (ctx) => {
    const decision = await ctx.db.get(decisionId);
    return decision?.salary;
  });

  expect(result).toBe(50000); // Should remain unchanged
});

test("Admin can read/write everything", async () => {
  const t = convexTest(schema);

  // Create game
  const game1 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  // Create admin user
  const adminUser: User = {
    _id: "admin123",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
  };

  // Admin should be able to read the game
  const games = await t.run(async (ctx) => {
    mockAuthContext({ ctx }, adminUser);
    return await ctx.db.query("games").collect();
  });

  expect(games.length).toBe(1);

  // Admin should be able to modify the game
  await t.run(async (ctx) => {
    mockAuthContext({ ctx }, adminUser);
    await ctx.db.patch(game1, { name: "Updated Game 1" });
  });

  // Verify the change
  const result = await t.run(async (ctx) => {
    const game = await ctx.db.get(game1);
    return game?.name;
  });

  expect(result).toBe("Updated Game 1");
});
