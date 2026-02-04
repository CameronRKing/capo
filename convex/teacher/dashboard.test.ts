/**
 * Teacher Dashboard Tests
 *
 * Comprehensive tests for dashboard domain functions including:
 * - Teacher access control
 * - Dashboard data aggregation
 * - Company status tracking
 * - Deadline calculations
 * - Recent activity feeds
 */

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

describe("Teacher Dashboard - getDashboardData", () => {
  test("returns dashboard data for teacher's assigned game", async () => {
    const t = convexTest(schema);

    // Create game
    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    // Create teacher
    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    // Create companies
    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const company2 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Retail",
      name: "Company B",
    });

    // Create hiring decision for company1 (submitted)
    await t.run(api.internal.createHiringDecision, {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "silver",
      travel: "monthly_per_diem",
      perDiem: 100,
      hasSalesContest: true,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: Date.now(),
    });

    // Query dashboard as teacher
    const dashboardData = await t.run(api.teacher.dashboard.getDashboardData, { gameId });

    expect(dashboardData).not.toBeNull();
    expect(dashboardData?.game.name).toBe("Test Game");
    expect(dashboardData?.game.currentQuarter).toBe(1);
    expect(dashboardData?.game.currentPhase).toBe("hiring");
    expect(dashboardData?.companyCount).toBe(2);
    expect(dashboardData?.submittedCount).toBe(1);
    expect(dashboardData?.pendingCount).toBe(1);
    expect(dashboardData?.currentPhase).toBe("hiring");
  });

  test("handles empty game (no companies)", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Empty Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const dashboardData = await t.run(api.teacher.dashboard.getDashboardData, { gameId });

    expect(dashboardData).not.toBeNull();
    expect(dashboardData?.companyCount).toBe(0);
    expect(dashboardData?.submittedCount).toBe(0);
    expect(dashboardData?.pendingCount).toBe(0);
  });

  test("handles leadership phase submissions", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "leadership",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    // Create leadership decision
    await t.run(api.internal.createLeadershipDecision, {
      companyId: company1,
      quarter: 1,
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: true,
      buyCompensationReport: false,
      buyPerformanceReport: false,
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: Date.now(),
    });

    const dashboardData = await t.run(api.teacher.dashboard.getDashboardData, { gameId });

    expect(dashboardData?.submittedCount).toBe(1);
    expect(dashboardData?.currentPhase).toBe("leadership");
  });

  test("returns null for non-existent game", async () => {
    const t = convexTest(schema);

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId: undefined as any,
      companyId: undefined,
    });

    const nonExistentId = "nonexistent" as any;
    const dashboardData = await t.run(api.teacher.dashboard.getDashboardData, {
      gameId: nonExistentId,
    });

    expect(dashboardData).toBeNull();
  });
});

describe("Teacher Dashboard - getCompanyStatuses", () => {
  test("lists all companies with submission status", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const company2 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Retail",
      name: "Company B",
    });

    // Submit hiring for company1 only
    await t.run(api.internal.createHiringDecision, {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "silver",
      travel: "monthly_per_diem",
      perDiem: 100,
      hasSalesContest: true,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: Date.now(),
    });

    const statuses = await t.run(api.teacher.dashboard.getCompanyStatuses, { gameId });

    expect(statuses).toHaveLength(2);

    const company1Status = statuses.find((s) => s.companyId === company1);
    expect(company1Status?.hiringSubmitted).toBe(true);
    expect(company1Status?.leadershipSubmitted).toBe(false);

    const company2Status = statuses.find((s) => s.companyId === company2);
    expect(company2Status?.hiringSubmitted).toBe(false);
    expect(company2Status?.leadershipSubmitted).toBe(false);
  });

  test("handles mixed submission states", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "leadership",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const company2 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Retail",
      name: "Company B",
    });

    const company3 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Services",
      name: "Company C",
    });

    // Different submission states
    await t.run(api.internal.createHiringDecision, {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "silver",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: Date.now(),
    });

    await t.run(api.internal.createLeadershipDecision, {
      companyId: company2,
      quarter: 1,
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: true,
      buyCompensationReport: false,
      buyPerformanceReport: false,
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: Date.now(),
    });

    const statuses = await t.run(api.teacher.dashboard.getCompanyStatuses, { gameId });

    expect(statuses).toHaveLength(3);

    const c1 = statuses.find((s) => s.companyId === company1);
    expect(c1?.hiringSubmitted).toBe(true);
    expect(c1?.leadershipSubmitted).toBe(false);

    const c2 = statuses.find((s) => s.companyId === company2);
    expect(c2?.hiringSubmitted).toBe(false);
    expect(c2?.leadershipSubmitted).toBe(true);

    const c3 = statuses.find((s) => s.companyId === company3);
    expect(c3?.hiringSubmitted).toBe(false);
    expect(c3?.leadershipSubmitted).toBe(false);
  });

  test("sorts by last activity desc", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const company2 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Retail",
      name: "Company B",
    });

    const now = Date.now();
    const hourAgo = now - 3600000;

    // Company1 submitted recently
    await t.run(api.internal.createHiringDecision, {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "silver",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: now,
    });

    // Company2 submitted earlier
    await t.run(api.internal.createHiringDecision, {
      companyId: company2,
      quarter: 1,
      salary: 45000,
      commission: 12,
      benefits: "bronze",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 3,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: hourAgo,
    });

    const statuses = await t.run(api.teacher.dashboard.getCompanyStatuses, { gameId });

    expect(statuses[0].companyId).toBe(company1);
    expect(statuses[1].companyId).toBe(company2);
  });
});

describe("Teacher Dashboard - getUpcomingDeadlines", () => {
  test("returns deadlines for active game in hiring phase", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 2,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const deadlines = await t.run(api.teacher.dashboard.getUpcomingDeadlines, { gameId });

    expect(deadlines).not.toBeNull();
    expect(deadlines?.currentPhase).toBe("hiring");
    expect(deadlines?.quarter).toBe(2);
    expect(deadlines?.nextPhase).toBe("leadership");
    expect(deadlines?.nextQuarter).toBe(2);
    expect(deadlines?.status).toBe("active");
    expect(deadlines?.estimatedDeadlines).toHaveLength(2);
  });

  test("returns deadlines for active game in leadership phase", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 3,
      currentPhase: "leadership",
      length: 8,
      status: "active",
    });

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const deadlines = await t.run(api.teacher.dashboard.getUpcomingDeadlines, { gameId });

    expect(deadlines?.currentPhase).toBe("leadership");
    expect(deadlines?.quarter).toBe(3);
    expect(deadlines?.nextPhase).toBe("hiring");
    expect(deadlines?.nextQuarter).toBe(4);
  });

  test("handles completed game", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 8,
      currentPhase: "leadership",
      length: 8,
      status: "completed",
    });

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const deadlines = await t.run(api.teacher.dashboard.getUpcomingDeadlines, { gameId });

    expect(deadlines?.status).toBe("completed");
    expect(deadlines?.nextPhase).toBeNull();
    expect(deadlines?.nextQuarter).toBeNull();
    expect(deadlines?.estimatedDeadlines).toHaveLength(1);
  });

  test("returns null for non-existent game", async () => {
    const t = convexTest(schema);

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId: undefined as any,
      companyId: undefined,
    });

    const nonExistentId = "nonexistent" as any;
    const deadlines = await t.run(api.teacher.dashboard.getUpcomingDeadlines, {
      gameId: nonExistentId,
    });

    expect(deadlines).toBeNull();
  });
});

describe("Teacher Dashboard - getRecentActivity", () => {
  test("returns recent submissions in desc order", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const company2 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Retail",
      name: "Company B",
    });

    const now = Date.now();
    const hourAgo = now - 3600000;

    // Create submissions at different times
    await t.run(api.internal.createHiringDecision, {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "silver",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: now,
    });

    await t.run(api.internal.createHiringDecision, {
      companyId: company2,
      quarter: 1,
      salary: 45000,
      commission: 12,
      benefits: "bronze",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 3,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: hourAgo,
    });

    const activity = await t.run(api.teacher.dashboard.getRecentActivity, {
      gameId,
      limit: 10,
    });

    expect(activity).toHaveLength(2);
    expect(activity[0].companyId).toBe(company1);
    expect(activity[1].companyId).toBe(company2);
    expect(activity[0].timestamp).toBeGreaterThan(activity[1].timestamp);
  });

  test("respects limit parameter", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    // Create 5 companies
    for (let i = 0; i < 5; i++) {
      const companyId = await t.run(api.internal.createCompany, {
        gameId,
        industry: "Manufacturing",
        name: `Company ${i}`,
      });

      await t.run(api.internal.createHiringDecision, {
        companyId,
        quarter: 1,
        salary: 50000,
        commission: 10,
        benefits: "silver",
        travel: "reps_pay_own",
        hasSalesContest: false,
        salesContestType: "open",
        salesContestThreshold: 50000,
        trainingProductKnowledge: 25,
        trainingMarketOrientation: 25,
        trainingCompanyOrientation: 25,
        trainingSellingTechniques: 25,
        numberToHire: 5,
        firingList: [],
        isSubmitted: true,
        submittedBy: teacherId,
        submittedAt: Date.now(),
      });
    }

    const activity = await t.run(api.teacher.dashboard.getRecentActivity, {
      gameId,
      limit: 3,
    });

    expect(activity).toHaveLength(3);
  });

  test("returns empty array when no activity", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 8,
      status: "active",
    });

    await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const activity = await t.run(api.teacher.dashboard.getRecentActivity, {
      gameId,
      limit: 10,
    });

    expect(activity).toHaveLength(0);
  });

  test("handles both hiring and leadership submissions", async () => {
    const t = convexTest(schema);

    const gameId = await t.run(api.internal.createGame, {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "leadership",
      length: 8,
      status: "active",
    });

    const teacherId = await t.run(api.internal.createUser, {
      name: "Teacher User",
      email: "teacher@example.com",
      role: "teacher",
      gameId,
      companyId: undefined,
    });

    const company1 = await t.run(api.internal.createCompany, {
      gameId,
      industry: "Manufacturing",
      name: "Company A",
    });

    const now = Date.now();

    // Create hiring decision
    await t.run(api.internal.createHiringDecision, {
      companyId: company1,
      quarter: 1,
      salary: 50000,
      commission: 10,
      benefits: "silver",
      travel: "reps_pay_own",
      hasSalesContest: false,
      salesContestType: "open",
      salesContestThreshold: 50000,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 5,
      firingList: [],
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: now - 1000,
    });

    // Create leadership decision
    await t.run(api.internal.createLeadershipDecision, {
      companyId: company1,
      quarter: 1,
      timeRecruiting: 25,
      timeMeetingCustomers: 25,
      timeSalesPlanning: 25,
      timeAdministrativePaperwork: 25,
      buyTerritoryReport: true,
      buyCompensationReport: false,
      buyPerformanceReport: false,
      isSubmitted: true,
      submittedBy: teacherId,
      submittedAt: now,
    });

    const activity = await t.run(api.teacher.dashboard.getRecentActivity, {
      gameId,
      limit: 10,
    });

    expect(activity).toHaveLength(2);
    expect(activity[0].type).toBe("leadership_submit");
    expect(activity[1].type).toBe("hiring_submit");
  });
});
