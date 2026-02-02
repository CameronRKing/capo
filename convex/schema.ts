import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // --------------------------------------------------
  // Game Management
  // --------------------------------------------------
  games: defineTable({
    name: v.string(),
    currentQuarter: v.number(),
    currentPhase: v.union(v.literal("hiring"), v.literal("leadership")),
    length: v.number(), // Number of quarters
    status: v.union(v.literal("setup"), v.literal("active"), v.literal("completed")),
  })
    .index("by_status", ["status"]),

  // --------------------------------------------------
  // Company Organization
  // --------------------------------------------------
  companies: defineTable({
    gameId: v.id("games"),
    industry: v.string(),
    name: v.string(),
  })
    .index("by_game", ["gameId"])
    .index("by_industry", ["gameId", "industry"]),

  // --------------------------------------------------
  // User Management (via @convex-dev/auth)
  // --------------------------------------------------
  users: defineTable({ // Extended from auth
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
    gameId: v.optional(v.id("games")), // Teacher/student assignment
    companyId: v.optional(v.id("companies")), // Student assignment
  })
    .index("by_email", ["email"])
    .index("by_game", ["gameId", "role"])
    .index("by_company", ["companyId"]),

  // --------------------------------------------------
  // Access Requests
  // --------------------------------------------------
  accessRequests: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("teacher"), v.literal("student")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
    requestedGameId: v.optional(v.id("games")), // Selected on approval
    requestedCompanyId: v.optional(v.id("companies")), // Selected on approval
  })
    .index("by_status", ["status"]),

  // --------------------------------------------------
  // Decision Data (Hiring)
  // --------------------------------------------------
  hiringDecisions: defineTable({
    companyId: v.id("companies"),
    quarter: v.number(),

    // Compensation
    salary: v.number(), // Annual USD
    commission: v.number(), // Percentage 0-100
    benefits: v.union(v.literal("bronze"), v.literal("silver"), v.literal("gold")),
    travel: v.union(v.literal("reps_pay_own"), v.literal("monthly_per_diem"), v.literal("unlimited")),
    perDiem: v.optional(v.number()), // Required when travel=monthly_per_diem

    // Sales Contest
    hasSalesContest: v.boolean(),
    salesContestType: v.union(v.literal("open"), v.literal("closed")),
    salesContestThreshold: v.number(),

    // Training Time Allocation (must sum to 100)
    trainingProductKnowledge: v.number(),
    trainingMarketOrientation: v.number(),
    trainingCompanyOrientation: v.number(),
    trainingSellingTechniques: v.number(),

    // Hiring & Firing
    numberToHire: v.number(),
    firingList: v.array(v.id("activeReps")),

    // Submission Tracking
    isSubmitted: v.boolean(),
    submittedBy: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
  })
    .index("by_company_quarter", ["companyId", "quarter"]),

  // --------------------------------------------------
  // Decision Data (Leadership)
  // --------------------------------------------------
  leadershipDecisions: defineTable({
    companyId: v.id("companies"),
    quarter: v.number(),

    // Manager Time Allocation (must sum to 100)
    timeRecruiting: v.number(),
    timeMeetingCustomers: v.number(),
    timeSalesPlanning: v.number(),
    timeAdministrativePaperwork: v.number(),

    // Market Reports
    buyTerritoryReport: v.boolean(),
    buyCompensationReport: v.boolean(),
    buyPerformanceReport: v.boolean(),

    // Submission Tracking
    isSubmitted: v.boolean(),
    submittedBy: v.optional(v.id("users")),
    submittedAt: v.optional(v.number()),
  })
    .index("by_company_quarter", ["companyId", "quarter"]),

  // --------------------------------------------------
  // Active Reps (Per Company, Per Quarter)
  // --------------------------------------------------
  activeReps: defineTable({
    companyId: v.id("companies"),
    quarter: v.number(),
    repId: v.string(), // Resume ID from constants

    // Decisions
    willLetGo: v.boolean(),
    individualHours: v.number(),
    leadershipBehavior: v.union(
      v.literal("Praise"),
      v.literal("Punishment"),
      v.literal("Rules"),
      v.literal("Goals"),
      v.literal("Support")
    ),
    territories: v.array(v.number()), // County IDs

    // Computed Fields (updated via triggers/actions)
    sales: v.optional(v.number()),
    performance: v.optional(v.number()),
    marketShare: v.optional(v.number()),
  })
    .index("by_company_quarter", ["companyId", "quarter"])
    .index("by_rep_quarter", ["repId", "quarter"]),

  // --------------------------------------------------
  // Resume Rankings (Per Student)
  // --------------------------------------------------
  resumeRankings: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    repId: v.string(), // Resume ID
    group: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    rank: v.number(), // Position within group
  })
    .index("by_user_company", ["userId", "companyId"])
    .index("by_company_group", ["companyId", "group", "rank"]),

  // --------------------------------------------------
  // Hiring Lists (Combined Company Rankings)
  // --------------------------------------------------
  hiringLists: defineTable({
    companyId: v.id("companies"),
    quarter: v.number(),
    repIds: v.array(v.string()), // Ordered list of resume IDs
  })
    .index("by_company_quarter", ["companyId", "quarter"]),

  // --------------------------------------------------
  // Reports & Outcomes
  // --------------------------------------------------
  repPerformanceReports: defineTable({
    companyId: v.id("companies"),
    quarter: v.number(),
    repId: v.string(),

    // Performance Metrics
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
  })
    .index("by_company_quarter", ["companyId", "quarter"]),

  financialReports: defineTable({
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
  })
    .index("by_company_quarter", ["companyId", "quarter"]),

  hiringOutcomeReports: defineTable({
    companyId: v.id("companies"),
    quarter: v.number(),

    oldRepOutcomes: v.array(v.object({
      repId: v.string(),
      outcome: v.union(v.literal("retained"), v.literal("poached")),
    })),
    newRepOutcomes: v.array(v.object({
      repId: v.string(),
      outcome: v.union(v.literal("hired"), v.literal("not_hired")),
    })),
  })
    .index("by_company_quarter", ["companyId", "quarter"]),

  // --------------------------------------------------
  // Static Data (Seeded Reference Tables)
  // --------------------------------------------------
  resumes: defineTable({
    repId: v.string(), // e.g., "rep1", "rep2", etc.
    name: v.string(),
    gender: v.union(v.literal("M"), v.literal("F")),
    education: v.string(),
    experience: v.string(),
    intelligence: v.number(),
    myers_briggs: v.string(), // e.g., "ISTP", "ENFP", etc.
    other_info: v.string(),
    interview: v.string(),
    reference_check: v.string(),
  })
    .index("by_repId", ["repId"]),

  counties: defineTable({
    id: v.number(), // 1-88
    name: v.string(),
    state_id: v.string(), // "OH"
    population: v.string(), // Keep as string from source
    path: v.string(), // SVG path string
  })
    .index("by_id", ["id"]),
});
