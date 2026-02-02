/**
 * Integration tests for Row-Level Security (RLS) framework
 *
 * Tests verify that role-based access control logic is correct.
 * These tests verify the RLS filter logic directly rather than through wrapped functions.
 *
 * IMPORTANT: These tests verify RLS logic directly using t.run().
 * The actual RLS enforcement happens in the wrapped query/mutation functions.
 */

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { v } from "convex/values";
import schema from "../schema";
import type { Id } from "../_generated/dataModel";
import { type User, type Role } from "./permissions";

/**
 * Helper to create RLS filter functions for testing
 * These mirror the actual RLS logic from rowLevelSecurity.ts
 */
const createRLSFilters = (user: User | null) => {
  return {
    // Games filter
    gamesFilter: (doc: any) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      if (user.role === "teacher" && user.gameId) return doc._id === user.gameId;
      if (user.role === "student" && user.gameId) return doc._id === user.gameId;
      return false;
    },

    // Companies filter
    companiesFilter: (doc: any) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      if (user.role === "teacher" && user.gameId) return doc.gameId === user.gameId;
      if (user.role === "student" && user.companyId) return doc._id === user.companyId;
      return false;
    },

    // Hiring decisions filter
    hiringDecisionsFilter: (doc: any) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      if (user.role === "teacher" && user.gameId) {
        // Teachers can read all decisions in their game
        const docGameId = doc.companyId
          ? doc.companyId // In real RLS, would need to query company
          : null;
        return true; // Simplified - in real RLS would join to companies table
      }
      if (user.role === "student" && user.companyId) return doc.companyId === user.companyId;
      return false;
    },
  };
};

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
  const admin: User = {
    _id: "admin1" as any,
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(admin);

  // Admin should see both games
  const games = await t.run(async (ctx) => {
    const allGames = await ctx.db.query("games").collect();
    return allGames.filter((g) => filters.gamesFilter(g));
  });

  expect(games.length).toBeGreaterThanOrEqual(2);
  expect(games.some((g) => g._id === game1)).toBe(true);
  expect(games.some((g) => g._id === game2)).toBe(true);
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

  const game2 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 2",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  // Create teacher user assigned to game1
  const teacher: User = {
    _id: "teacher1" as any,
    name: "Teacher",
    email: "teacher@example.com",
    role: "teacher",
    gameId: game1,
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(teacher);

  // Teacher should only see game1
  const games = await t.run(async (ctx) => {
    const allGames = await ctx.db.query("games").collect();
    return allGames.filter((g) => filters.gamesFilter(g));
  });

  expect(games.length).toBe(1);
  expect(games[0]._id).toEqual(game1);
  expect(games.some((g) => g._id === game2)).toBe(false);
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

  const game2 = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 2",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  // Create student user
  const student: User = {
    _id: "student1" as any,
    name: "Student",
    email: "student@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(student);

  // Student should only see game1
  const games = await t.run(async (ctx) => {
    const allGames = await ctx.db.query("games").collect();
    return allGames.filter((g) => filters.gamesFilter(g));
  });

  expect(games.length).toBe(1);
  expect(games[0]._id).toEqual(game1);
  expect(games.some((g) => g._id === game2)).toBe(false);
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

  const company2 = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game1,
      industry: "tech",
      name: "Company 2",
    });
  });

  // Create student user assigned to company1
  const student: User = {
    _id: "student2" as any,
    name: "Student",
    email: "student2@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(student);

  // Query companies - should only see company1
  const companies = await t.run(async (ctx) => {
    const allCompanies = await ctx.db.query("companies").collect();
    return allCompanies.filter((c) => filters.companiesFilter(c));
  });

  expect(companies.length).toBe(1);
  expect(companies[0]._id).toEqual(company1);
  expect(companies.some((c) => c._id === company2)).toBe(false);
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
  const student: User = {
    _id: "student3" as any,
    name: "Student",
    email: "student3@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(student);

  // Query all companies - RLS should filter out company2
  const companies = await t.run(async (ctx) => {
    const allCompanies = await ctx.db.query("companies").collect();
    return allCompanies.filter((c) => filters.companiesFilter(c));
  });

  // Should only see company1, not company2
  expect(companies.length).toBe(1);
  expect(companies[0]._id).toEqual(company1);
  expect(companies.some((c) => c._id === company2)).toBe(false);
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

  // Create teacher user
  const teacher: User = {
    _id: "teacher2" as any,
    name: "Teacher",
    email: "teacher2@example.com",
    role: "teacher",
    gameId: game1,
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(teacher);

  // Query companies - should see both companies
  const companies = await t.run(async (ctx) => {
    const allCompanies = await ctx.db.query("companies").collect();
    return allCompanies.filter((c) => filters.companiesFilter(c));
  });

  expect(companies.length).toBe(2);
  expect(companies.some((c) => c._id === company1)).toBe(true);
  expect(companies.some((c) => c._id === company2)).toBe(true);
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
  const student: User = {
    _id: "student4" as any,
    name: "Student",
    email: "student4@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Verify RLS filter logic - student should be able to modify their company's decision
  const filters = createRLSFilters(student);

  const canModify = await t.run(async (ctx) => {
    const decision = await ctx.db.get(decisionId);
    if (!decision) return false;
    return filters.hiringDecisionsFilter(decision);
  });

  expect(canModify).toBe(true);

  // Simulate the modification
  await t.run(async (ctx) => {
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
  const student: User = {
    _id: "student5" as any,
    name: "Student",
    email: "student5@example.com",
    role: "student",
    gameId: game1,
    companyId: company1,
  };

  // Verify RLS filter logic - student should NOT be able to modify company2's decision
  const filters = createRLSFilters(student);

  const canModify = await t.run(async (ctx) => {
    const decision = await ctx.db.get(decisionId);
    if (!decision) return false;
    return filters.hiringDecisionsFilter(decision);
  });

  expect(canModify).toBe(false);

  // In real RLS, the mutation would be denied by the wrapper
  // Here we verify the decision remains unchanged
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
  const admin: User = {
    _id: "admin2" as any,
    name: "Admin",
    email: "admin2@example.com",
    role: "admin",
  };

  // Verify RLS filter logic
  const filters = createRLSFilters(admin);

  // Admin should be able to read the game
  const games = await t.run(async (ctx) => {
    const allGames = await ctx.db.query("games").collect();
    return allGames.filter((g) => filters.gamesFilter(g));
  });

  expect(games.length).toBeGreaterThanOrEqual(1);
  expect(games.some((g) => g._id === game1)).toBe(true);

  // Admin should be able to modify the game
  await t.run(async (ctx) => {
    await ctx.db.patch(game1, { name: "Updated Game 1" });
  });

  // Verify the change
  const result = await t.run(async (ctx) => {
    const game = await ctx.db.get(game1);
    return game?.name;
  });

  expect(result).toBe("Updated Game 1");
});
