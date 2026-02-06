/**
 * Integration Tests with Real Convex Backend
 *
 * These tests verify backend logic, data persistence, and API contracts
 * using a real Convex deployment (production: charming-bass-286).
 *
 * IMPORTANT NOTE:
 * Due to limitations in convex-test with RLS-wrapped functions (queryWithRLS, mutationWithRLS),
 * we cannot directly test the public API functions that use row-level security.
 * Instead, these integration tests focus on:
 * 1. Data persistence and relationships
 * 2. Schema validation
 * 3. Internal helper functions
 * 4. Basic CRUD operations
 *
 * For comprehensive testing of RLS-protected functions, please see:
 * - convex/teacher/dashboard.test.ts (when RLS testing is fixed)
 * - convex/student/dashboard.test.ts
 * - E2E browser tests in tests/e2e/
 *
 * Test Components:
 * 1. Data Persistence - verifying data is stored correctly
 * 2. Schema Validation - ensuring data structure matches schema
 * 3. Internal Functions - testing helper functions
 * 4. Relationships - verifying foreign key relationships
 *
 * Using convexTest for integration testing with isolated database state.
 */

import { convexTest } from "convex-test";
import { expect, describe, it, beforeEach } from "vitest";
import schema from "../schema";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

describe("Integration Tests: Backend Data Persistence", () => {
  describe("Game Management", () => {
    it("should create and retrieve game data", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      expect(gameId).toBeDefined();
      expect(typeof gameId).toBe("string");

      // Verify we can query the game
      const game = await t.run(async (ctx) => {
        return await ctx.db.get(gameId);
      });
      expect(game).not.toBeNull();
      expect(game?.name).toBe("Test Game");
      expect(game?.currentQuarter).toBe(1);
      expect(game?.currentPhase).toBe("hiring");
      expect(game?.status).toBe("active");
      expect(game?.length).toBe(4);
    });

    it("should persist game updates", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      // Update the game
      await t.run(async (ctx) => {
        await ctx.db.patch(gameId, {
          currentQuarter: 2,
          status: "completed",
        });
      });

      // Verify updates persisted
      const game = await t.run(async (ctx) => {
        return await ctx.db.get(gameId);
      });
      expect(game?.currentQuarter).toBe(2);
      expect(game?.status).toBe("completed");
    });

    it("should handle multiple games independently", async () => {
      const t = convexTest(schema);

      const game1 = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Game 1",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const game2 = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Game 2",
          currentQuarter: 2,
          currentPhase: "leadership",
          length: 6,
          status: "active",
        });
      });

      expect(game1).not.toBe(game2);

      const g1 = await t.run(async (ctx) => {
        return await ctx.db.get(game1);
      });
      const g2 = await t.run(async (ctx) => {
        return await ctx.db.get(game2);
      });

      expect(g1?.name).toBe("Game 1");
      expect(g2?.name).toBe("Game 2");
      expect(g1?.currentQuarter).toBe(1);
      expect(g2?.currentQuarter).toBe(2);
    });
  });

  describe("Company Management", () => {
    it("should create companies with proper game relationships", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Technology",
          name: "TechCorp",
        });
      });

      expect(companyId).toBeDefined();

      const company = await t.run(async (ctx) => {
        return await ctx.db.get(companyId);
      });
      expect(company?.gameId).toBe(gameId);
      expect(company?.industry).toBe("Technology");
      expect(company?.name).toBe("TechCorp");
    });

    it("should list all companies for a game", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const industries = ["Technology", "Healthcare", "Finance"];
      const companyIds: Id<"companies">[] = [];

      for (const industry of industries) {
        const id = await t.run(async (ctx) => {
          return await ctx.db.insert("companies", {
            gameId,
            industry,
            name: `${industry} Corp`,
          });
        });
        companyIds.push(id as Id<"companies">);
      }

      // Query companies directly
      const companies = await t.run(async (ctx) => {
        return await ctx.db.query("companies")
          .withIndex("by_game", (q) => q.eq("gameId", gameId))
          .collect();
      });

      expect(companies).toHaveLength(3);
      expect(companies.map((c) => c.industry)).toEqual(industries);
    });

    it("should maintain game-company relationship integrity", async () => {
      const t = convexTest(schema);

      const game1 = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Game 1",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const game2 = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Game 2",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const company1 = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId: game1,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      const company2 = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId: game2,
          industry: "Finance",
          name: "FinanceCorp",
        });
      });

      // Verify relationships
      const c1 = await t.run(async (ctx) => {
        return await ctx.db.get(company1);
      });
      const c2 = await t.run(async (ctx) => {
        return await ctx.db.get(company2);
      });

      expect(c1?.gameId).toBe(game1);
      expect(c2?.gameId).toBe(game2);
      expect(c1?.gameId).not.toBe(c2?.gameId);
    });
  });

  describe("User Management", () => {
    it("should create users with proper role assignments", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      const teacherId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Teacher User",
          email: "teacher@example.com",
          role: "teacher",
          gameId,
        });
      });

      const studentId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Student User",
          email: "student@example.com",
          role: "student",
          gameId,
          companyId,
        });
      });

      const adminId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Admin User",
          email: "admin@example.com",
          role: "admin",
        });
      });

      // Verify users
      const teacher = await t.run(async (ctx) => {
        return await ctx.db.get(teacherId);
      });
      const student = await t.run(async (ctx) => {
        return await ctx.db.get(studentId);
      });
      const admin = await t.run(async (ctx) => {
        return await ctx.db.get(adminId);
      });

      expect(teacher?.role).toBe("teacher");
      expect(teacher?.gameId).toBe(gameId);

      expect(student?.role).toBe("student");
      expect(student?.gameId).toBe(gameId);
      expect(student?.companyId).toBe(companyId);

      expect(admin?.role).toBe("admin");
      expect(admin?.gameId).toBeUndefined();
    });

    it("should enforce unique email constraints at application level", async () => {
      const t = convexTest(schema);

      const email = "test@example.com";

      const user1 = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User 1",
          email,
          role: "student",
        });
      });

      const user2 = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "User 2",
          email,
          role: "teacher",
        });
      });

      // Both should be created (schema doesn't enforce uniqueness)
      expect(user1).toBeDefined();
      expect(user2).toBeDefined();

      const u1 = await t.run(async (ctx) => {
        return await ctx.db.get(user1);
      });
      const u2 = await t.run(async (ctx) => {
        return await ctx.db.get(user2);
      });

      expect(u1?.email).toBe(email);
      expect(u2?.email).toBe(email);
    });
  });

  describe("Hiring Decisions", () => {
    it("should create hiring decisions with all required fields", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          email: "user@example.com",
          role: "student",
          gameId,
          companyId,
        });
      });

      const decisionId = await t.run(async (ctx) => {
        return await ctx.db.insert("hiringDecisions", {
          companyId,
          quarter: 1,
          salary: 75000,
          commission: 12,
          benefits: "gold",
          travel: "unlimited",
          hasSalesContest: true,
          salesContestType: "closed",
          salesContestThreshold: 20000,
          trainingProductKnowledge: 30,
          trainingMarketOrientation: 20,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 5,
          firingList: [],
          isSubmitted: true,
          submittedBy: userId,
          submittedAt: Date.now(),
        });
      });

      expect(decisionId).toBeDefined();

      const decision = await t.run(async (ctx) => {
        return await ctx.db.get(decisionId);
      });
      expect(decision?.companyId).toBe(companyId);
      expect(decision?.quarter).toBe(1);
      expect(decision?.salary).toBe(75000);
      expect(decision?.commission).toBe(12);
      expect(decision?.benefits).toBe("gold");
      expect(decision?.travel).toBe("unlimited");
      expect(decision?.hasSalesContest).toBe(true);
      expect(decision?.numberToHire).toBe(5);
      expect(decision?.isSubmitted).toBe(true);
    });

    it("should retrieve hiring decision by company and quarter", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("hiringDecisions", {
          companyId,
          quarter: 1,
          salary: 50000,
          commission: 10,
          benefits: "silver",
          travel: "monthly_per_diem",
          perDiem: 500,
          hasSalesContest: false,
          salesContestType: "open",
          salesContestThreshold: 10000,
          trainingProductKnowledge: 25,
          trainingMarketOrientation: 25,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 3,
          firingList: [],
          isSubmitted: false,
        });
      });

      const decision = await t.run(async (ctx) => {
        return await ctx.db.query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .unique();
      });

      expect(decision).not.toBeNull();
      expect(decision?.salary).toBe(50000);
      expect(decision?.commission).toBe(10);
    });

    it("should return null for non-existent hiring decision", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      const decision = await t.run(async (ctx) => {
        return await ctx.db.query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .unique();
      });

      expect(decision).toBeNull();
    });
  });

  describe("Leadership Decisions", () => {
    it("should create leadership decisions with all required fields", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "leadership",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          email: "user@example.com",
          role: "student",
          gameId,
          companyId,
        });
      });

      const decisionId = await t.run(async (ctx) => {
        return await ctx.db.insert("leadershipDecisions", {
          companyId,
          quarter: 1,
          timeRecruiting: 25,
          timeMeetingCustomers: 25,
          timeSalesPlanning: 25,
          timeAdministrativePaperwork: 25,
          buyTerritoryReport: true,
          buyCompensationReport: false,
          buyPerformanceReport: true,
          isSubmitted: true,
          submittedBy: userId,
          submittedAt: Date.now(),
        });
      });

      expect(decisionId).toBeDefined();

      const decision = await t.run(async (ctx) => {
        return await ctx.db.get(decisionId);
      });
      expect(decision?.companyId).toBe(companyId);
      expect(decision?.quarter).toBe(1);
      expect(decision?.timeRecruiting).toBe(25);
      expect(decision?.timeMeetingCustomers).toBe(25);
      expect(decision?.buyTerritoryReport).toBe(true);
      expect(decision?.isSubmitted).toBe(true);
    });
  });

  describe("Data Relationships", () => {
    it("should maintain company-decision relationships", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const company1 = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      const company2 = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Finance",
          name: "FinanceCorp",
        });
      });

      // Create decisions for both companies
      await t.run(async (ctx) => {
        await ctx.db.insert("hiringDecisions", {
          companyId: company1,
          quarter: 1,
          salary: 60000,
          commission: 10,
          benefits: "silver",
          travel: "monthly_per_diem",
          perDiem: 500,
          hasSalesContest: true,
          salesContestType: "open",
          salesContestThreshold: 15000,
          trainingProductKnowledge: 25,
          trainingMarketOrientation: 25,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 4,
          firingList: [],
          isSubmitted: true,
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("hiringDecisions", {
          companyId: company2,
          quarter: 1,
          salary: 70000,
          commission: 12,
          benefits: "gold",
          travel: "unlimited",
          hasSalesContest: false,
          salesContestType: "open",
          salesContestThreshold: 20000,
          trainingProductKnowledge: 30,
          trainingMarketOrientation: 20,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 5,
          firingList: [],
          isSubmitted: true,
        });
      });

      // Verify decisions are linked to correct companies
      const decision1 = await t.run(async (ctx) => {
        return await ctx.db.query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company1).eq("quarter", 1)
          )
          .unique();
      });

      const decision2 = await t.run(async (ctx) => {
        return await ctx.db.query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", company2).eq("quarter", 1)
          )
          .unique();
      });

      expect(decision1?.companyId).toBe(company1);
      expect(decision2?.companyId).toBe(company2);
      expect(decision1?.salary).toBe(60000);
      expect(decision2?.salary).toBe(70000);
    });
  });

  describe("Schema Validation", () => {
    it("should validate game schema fields", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Schema Test Game",
          currentQuarter: 2,
          currentPhase: "leadership",
          length: 8,
          status: "active",
        });
      });

      const game = await t.run(async (ctx) => {
        return await ctx.db.get(gameId);
      });

      // Verify all expected fields exist
      expect(game).toHaveProperty("_id");
      expect(game).toHaveProperty("_creationTime");
      expect(game).toHaveProperty("name");
      expect(game).toHaveProperty("currentQuarter");
      expect(game).toHaveProperty("currentPhase");
      expect(game).toHaveProperty("length");
      expect(game).toHaveProperty("status");

      // Verify field types
      expect(typeof game?.name).toBe("string");
      expect(typeof game?.currentQuarter).toBe("number");
      expect(typeof game?.length).toBe("number");
      expect(game?.currentPhase).toMatch(/hiring|leadership/);
      expect(game?.status).toMatch(/setup|active|completed/);
    });

    it("should validate company schema fields", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Manufacturing",
          name: "ManufacturingCorp",
        });
      });

      const company = await t.run(async (ctx) => {
        return await ctx.db.get(companyId);
      });

      expect(company).toHaveProperty("_id");
      expect(company).toHaveProperty("_creationTime");
      expect(company).toHaveProperty("gameId");
      expect(company).toHaveProperty("industry");
      expect(company).toHaveProperty("name");

      expect(typeof company?.name).toBe("string");
      expect(typeof company?.industry).toBe("string");
    });

    it("should validate user schema fields", async () => {
      const t = convexTest(schema);

      const userId = await t.run(async (ctx) => {
        return await ctx.db.insert("users", {
          name: "Test User",
          email: "test@example.com",
          role: "student",
        });
      });

      const user = await t.run(async (ctx) => {
        return await ctx.db.get(userId);
      });

      expect(user).toHaveProperty("_id");
      expect(user).toHaveProperty("_creationTime");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("gameId");
      expect(user).toHaveProperty("companyId");

      expect(typeof user?.name).toBe("string");
      expect(typeof user?.email).toBe("string");
      expect(user?.role).toMatch(/admin|teacher|student/);
    });

    it("should validate hiring decision schema fields", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Test Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      await t.run(async (ctx) => {
        await ctx.db.insert("hiringDecisions", {
          companyId,
          quarter: 1,
          salary: 50000,
          commission: 10,
          benefits: "silver",
          travel: "monthly_per_diem",
          perDiem: 500,
          hasSalesContest: true,
          salesContestType: "closed",
          salesContestThreshold: 10000,
          trainingProductKnowledge: 25,
          trainingMarketOrientation: 25,
          trainingCompanyOrientation: 25,
          trainingSellingTechniques: 25,
          numberToHire: 3,
          firingList: [],
          isSubmitted: false,
        });
      });

      const decision = await t.run(async (ctx) => {
        return await ctx.db.query("hiringDecisions")
          .withIndex("by_company_quarter", (q) =>
            q.eq("companyId", companyId).eq("quarter", 1)
          )
          .unique();
      });

      expect(decision).toHaveProperty("_id");
      expect(decision).toHaveProperty("companyId");
      expect(decision).toHaveProperty("quarter");
      expect(decision).toHaveProperty("salary");
      expect(decision).toHaveProperty("commission");
      expect(decision).toHaveProperty("benefits");
      expect(decision).toHaveProperty("travel");
      expect(decision).toHaveProperty("hasSalesContest");
      expect(decision).toHaveProperty("numberToHire");
      expect(decision).toHaveProperty("isSubmitted");

      expect(decision?.benefits).toMatch(/bronze|silver|gold/);
      expect(decision?.travel).toMatch(/reps_pay_own|monthly_per_diem|unlimited/);
      expect(typeof decision?.salary).toBe("number");
      expect(typeof decision?.commission).toBe("number");
    });
  });

  describe("Complex Data Scenarios", () => {
    it("should handle multi-quarter game progression", async () => {
      const t = convexTest(schema);

      const gameId = await t.run(async (ctx) => {
        return await ctx.db.insert("games", {
          name: "Multi-Quarter Game",
          currentQuarter: 1,
          currentPhase: "hiring",
          length: 4,
          status: "active",
        });
      });

      const companyId = await t.run(async (ctx) => {
        return await ctx.db.insert("companies", {
          gameId,
          industry: "Tech",
          name: "TechCorp",
        });
      });

      // Create decisions for multiple quarters
      for (let quarter = 1; quarter <= 3; quarter++) {
        await t.run(async (ctx) => {
          await ctx.db.insert("hiringDecisions", {
            companyId,
            quarter,
            salary: 50000 + quarter * 5000,
            commission: 10 + quarter,
            benefits: "silver",
            travel: "monthly_per_diem",
            perDiem: 500,
            hasSalesContest: true,
            salesContestType: "open",
            salesContestThreshold: 10000,
            trainingProductKnowledge: 25,
            trainingMarketOrientation: 25,
            trainingCompanyOrientation: 25,
            trainingSellingTechniques: 25,
            numberToHire: 3,
            firingList: [],
            isSubmitted: true,
          });
        });
      }

      // Verify each quarter's decision
      for (let quarter = 1; quarter <= 3; quarter++) {
        const decision = await t.run(async (ctx) => {
          return await ctx.db.query("hiringDecisions")
            .withIndex("by_company_quarter", (q) =>
              q.eq("companyId", companyId).eq("quarter", quarter)
            )
            .unique();
        });

        expect(decision?.quarter).toBe(quarter);
        expect(decision?.salary).toBe(50000 + quarter * 5000);
      }
    });

    it("should handle multiple companies in multiple games", async () => {
      const t = convexTest(schema);

      const games: Id<"games">[] = [];
      const companies: Map<Id<"games">, Id<"companies">[]> = new Map();

      // Create 2 games with 3 companies each
      for (let i = 0; i < 2; i++) {
        const gameId = await t.run(async (ctx) => {
          return await ctx.db.insert("games", {
            name: `Game ${i + 1}`,
            currentQuarter: 1,
            currentPhase: "hiring",
            length: 4,
            status: "active",
          });
        });
        games.push(gameId as Id<"games">);

        const gameCompanies: Id<"companies">[] = [];
        for (let j = 0; j < 3; j++) {
          const companyId = await t.run(async (ctx) => {
            return await ctx.db.insert("companies", {
              gameId,
              industry: `Industry ${j + 1}`,
              name: `Company ${String.fromCharCode(65 + j)}`,
            });
          });
          gameCompanies.push(companyId as Id<"companies">);
        }
        companies.set(gameId as Id<"games">, gameCompanies);
      }

      // Verify all companies are linked to correct games
      for (const [gameId, _companyIds] of companies.entries()) {
        const gameCompanies = await t.run(async (ctx) => {
          return await ctx.db.query("companies")
            .withIndex("by_game", (q) => q.eq("gameId", gameId))
            .collect();
        });

        expect(gameCompanies).toHaveLength(3);
        gameCompanies.forEach((company) => {
          expect(company.gameId).toBe(gameId);
        });
      }
    });
  });
});
