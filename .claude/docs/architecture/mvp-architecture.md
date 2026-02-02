# Capo Business Simulation MVP - Architecture Document

**Last Updated:** 2026-02-02
**Status:** Architecture Design Complete
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Principles](#architecture-principles)
3. [Technology Stack](#technology-stack)
4. [Data Layer Architecture](#data-layer-architecture)
5. [Service Layer Architecture](#service-layer-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [Real-Time Collaboration](#real-time-collaboration)
9. [Testing Strategy](#testing-strategy)
10. [Error Handling & Resilience](#error-handling--resilience)
11. [Deployment & DevOps](#deployment--devops)
12. [Development Workflow](#development-workflow)

---

## Executive Summary

The Capo Business Simulation MVP is a domain-driven application where students (in companies) make quarterly hiring and leadership decisions. Teachers monitor progress and trigger compilations that generate outcomes using stubbed semantic logic.

**Key Architectural Decisions:**

1. **Domain-Driven Design**: Agents express themselves in business language (Game, Company, Quarter, DecisionPhase) rather than technical CRUD
2. **Convex-First**: Leverage Convex's real-time database, serverless functions, and reactive subscriptions as the primary backend
3. **Type-Safe Layers**: Strict TypeScript with generated types from Convex schema ensures end-to-end type safety
4. **Real-Time by Default**: All data is reactive via Convex subscriptions; explicit opt-out for static data
5. **Minimal Boilerplate**: Custom hooks and helpers reduce repetition while maintaining clarity

---

## Architecture Principles

### 1. Domain Language Over Technical Jargon

**Preferred**: `getCompanyCurrentQuarter(gameId, companyId)`
**Avoided**: `getDocumentsWithFilter('active_reps', { gameId, companyId, quarter })`

### 2. Separation of Concerns

```
┌─────────────────────────────────────────┐
│         Frontend (React + Router)       │
│  - UI Components                        │
│  - Route Loaders                        │
│  - Client-Side Validation               │
└──────────────┬──────────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────────┐
│      Service Layer (Convex Functions)   │
│  - Domain Logic                         │
│  - Access Control                       │
│  - Business Rules                       │
└──────────────┬──────────────────────────┘
               │ Queries
┌──────────────▼──────────────────────────┐
│         Data Layer (Convex DB)          │
│  - Collections & Indexes                │
│  - Reactive Subscriptions               │
│  - ACID Transactions                    │
└─────────────────────────────────────────┘
```

### 3. Fail Fast & Validate Early

- **Client**: Real-time validation as users type (Zod schemas)
- **Server**: Re-validate all data on submission (never trust client)
- **UI**: Disable submit buttons until client validation passes

### 4. Progressive Enhancement

- **Core MVP**: Stubbed compilation with semantic dummy data
- **Future**: Swap compilation logic for full simulation engine
- **Extensibility**: Plugin architecture for decision types and report formats

---

## Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | Convex DB | Real-time document database with reactive subscriptions |
| **Backend** | Convex Functions | Serverless queries, mutations, actions |
| **Auth** | `@convex-dev/auth` | Magic-link authentication with role-based access |
| **Presence** | `@convex-dev/presence` | Real-time user presence & cursor tracking |
| **Validation** | Zod via `convex-helpers` | Schema validation with Zod integration |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 19 | UI with concurrent features |
| **Routing** | TanStack Router v1 | File-based routing with type-safe loaders |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with Vite plugin |
| **State** | Convex React Hooks | Real-time subscriptions (useQuery, useMutation) |
| **Validation** | Zod | Client-side validation matching backend |

### Development

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | TypeScript 5.9 (strict mode) | Type safety across stack |
| **Testing** | Vitest + convex-test | Unit & integration tests |
| **Build** | Vite 7 | Fast dev server & optimized builds |
| **Linting** | ESLint + TypeScript ESLint | Code quality & consistency |

---

## Data Layer Architecture

### Convex Schema Design

The schema uses **domain-driven collections** that mirror business concepts:

```typescript
// convex/schema.ts
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
    .index("by_company_quarter", ["companyId", "quarter"])
    .index("by_game_quarter", ["companyId", "quarter"]), // Composite via join

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
});
```

### Index Strategy

**Read Optimization**: Indexes are designed for common query patterns:

```typescript
// Common Query Patterns → Indexes

1. Get user by email → users.by_email
2. Get game companies → companies.by_game
3. Get company decisions → hiringDecisions.by_company_quarter
4. Get teacher dashboard → users.by_game (role filter)
5. Get industry reports → companies.by_industry
```

**Write Performance**: Limit indexes to what's necessary. Each index adds write overhead.

---

## Service Layer Architecture

### Custom Function Builders

Using `convex-helpers` to create domain-specific function builders:

```typescript
// convex/services/customFunctions.ts
import { customQuery, customMutation } from "convex-helpers/server/customFunctions";
import { query, mutation } from "./_generated/server";
import { hasRole } from "./auth/permissions";

// Domain-specific query builder with access control
export const gameQuery = customQuery(query, {
  args: {
    gameId: v.id("games"),
  },
  input: async (ctx, args) => {
    // Verify user has access to this game
    const user = await getCurrentUser(ctx);
    if (!hasRole(user, ["admin", "teacher"]) && user.gameId !== args.gameId) {
      throw new Error("Access denied to game");
    }

    return {
      ctx: { ...ctx, user, gameId: args.gameId },
      args: {}, // Clear gameId from args (now in ctx)
    };
  },
});

// Usage in domain services
export const getCompany = gameQuery({
  args: {
    companyId: v.id("companies"),
  },
  handler: async (ctx, { companyId }) => {
    // ctx.user and ctx.gameId are already validated
    const company = await ctx.db.get(companyId);
    if (company?.gameId !== ctx.gameId) {
      throw new Error("Company not in game");
    }
    return company;
  },
});
```

### Domain Services

Organize Convex functions by domain boundary:

```
convex/
├── domain/
│   ├── games/           # Game lifecycle, quarter progression
│   ├── companies/       # Company management, industry grouping
│   ├── decisions/       # Decision submission, validation
│   ├── compilation/     # Hiring/leadership compilation logic
│   ├── reports/         # Report generation, aggregation
│   └── rankings/        # Resume ranking, hiring lists
├── services/
│   ├── validation/      # Shared validation logic
│   ├── permissions/     # Access control helpers
│   ├── constants/       # Business constants (MIN_REPS, etc.)
│   └── presence/        # User presence & cursors
└── auth/
    ├── config.ts        # Auth configuration
    └── permissions.ts   # Role-based access control
```

### Access Control Patterns

#### Approach 1: Manual Authorization Checks

```typescript
// convex/services/permissions.ts
import { QueryCtx } from "./_generated/server";

export type Role = "admin" | "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  gameId?: string;
  companyId?: string;
}

export async function getCurrentUser(ctx: QueryCtx): Promise<User> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_email", q => q.eq("email", identity.email ?? ""))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export function hasRole(user: User, roles: Role[]): boolean {
  return roles.includes(user.role);
}

export function canAccessGame(user: User, gameId: string): boolean {
  return user.role === "admin" ||
         (user.role === "teacher" && user.gameId === gameId) ||
         (user.role === "student" && user.gameId === gameId);
}

export function canAccessCompany(user: User, companyId: string): boolean {
  return user.role === "admin" ||
         user.companyId === companyId;
}
```

#### Approach 2: Row-Level Security with convex-helpers (RECOMMENDED)

The project uses **convex-helpers' built-in Row-Level Security (RLS)** for automatic access control enforcement. This provides defense-in-depth by ensuring data access checks happen at the database layer, not just in business logic.

**Benefits for this use case:**
- **Automatic enforcement**: Can't forget to check permissions
- **Multi-level access control**: Support game-level (teacher) and company-level (student) filtering
- **Type-safe**: Rules are typed against your DataModel
- **Reactive**: When permissions change, data immediately disappears from queries
- **Defense in depth**: Complements manual checks, doesn't replace them

```typescript
// convex/services/rowLevelSecurity.ts
import { customCtx, customMutation, customQuery } from "convex-helpers/server/customFunctions";
import { Rules, wrapDatabaseReader, wrapDatabaseWriter } from "convex-helpers/server/rowLevelSecurity";
import { DataModel } from "../_generated/dataModel";
import { mutation, query, QueryCtx } from "../_generated/server";
import { User, getCurrentUser } from "./permissions";

/**
 * Define RLS rules for the business simulation
 * Rules are evaluated per-document for all database operations
 */
async function rlsRules(ctx: QueryCtx, user: User): Promise<Rules<QueryCtx, DataModel>> {
  return {
    // Games table
    games: {
      read: async (ctx, game) => {
        // Admins can read all games
        if (user.role === "admin") return true;
        // Teachers can read their assigned game
        if (user.role === "teacher" && user.gameId === game._id) return true;
        // Students can read their game
        if (user.role === "student" && user.gameId === game._id) return true;
        return false;
      },
      insert: () => user.role === "admin", // Only admins can create games
      modify: async (ctx, game) => {
        // Admins can modify all games
        if (user.role === "admin") return true;
        // Teachers can modify their game (e.g., update current quarter)
        if (user.role === "teacher" && user.gameId === game._id) return true;
        return false;
      },
    },

    // Companies table
    companies: {
      read: async (ctx, company) => {
        // Admins read all companies
        if (user.role === "admin") return true;
        // Teachers read all companies in their game
        if (user.role === "teacher" && user.gameId === company.gameId) return true;
        // Students read only their company
        if (user.role === "student" && user.companyId === company._id) return true;
        return false;
      },
      insert: () => user.role === "admin" || user.role === "teacher",
      modify: async (ctx, company) => {
        // Students can modify their company (decisions)
        if (user.role === "student" && user.companyId === company._id) return true;
        // Admins and teachers can modify companies
        return user.role === "admin" || (user.role === "teacher" && user.gameId === company.gameId);
      },
    },

    // Hiring decisions
    hiringDecisions: {
      read: async (ctx, decision) => {
        if (user.role === "admin") return true;
        // Teachers read decisions for all their game's companies
        if (user.role === "teacher") {
          const company = await ctx.db.get(decision.companyId);
          return company?.gameId === user.gameId;
        }
        // Students read only their company's decisions
        return user.companyId === decision.companyId;
      },
      insert: async (ctx, decision) => {
        // Students can create decisions for their company
        if (user.role === "student") return decision.companyId === user.companyId;
        // Admins and teachers can create decisions
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, decision) => {
        // Students can modify their company's decisions
        if (user.role === "student" && decision.companyId === user.companyId) return true;
        // Teachers can read but not modify student decisions
        if (user.role === "teacher") return false;
        // Admins can modify all decisions
        return user.role === "admin";
      },
    },

    // Leadership decisions (same pattern)
    leadershipDecisions: {
      read: async (ctx, decision) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(decision.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === decision.companyId;
      },
      insert: async (ctx, decision) => {
        if (user.role === "student") return decision.companyId === user.companyId;
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, decision) => {
        if (user.role === "student" && decision.companyId === user.companyId) return true;
        if (user.role === "teacher") return false;
        return user.role === "admin";
      },
    },

    // Reports (read-only for students)
    repPerformanceReports: {
      read: async (ctx, report) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(report.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === report.companyId;
      },
      insert: () => user.role === "admin" || user.role === "teacher",
      modify: () => false, // Reports are immutable after generation
    },

    financialReports: {
      read: async (ctx, report) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(report.companyId);
          return company?.gameId === user.gameId;
        }
        return user.companyId === report.companyId;
      },
      insert: () => user.role === "admin" || user.role === "teacher",
      modify: () => false,
    },

    // Active reps
    activeReps: {
      read: async (ctx, rep) => {
        if (user.role === "admin") return true;
        if (user.role === "teacher") {
          const company = await ctx.db.get(rep.companyId);
          return company?.gameId === user.gameId;
        }
        return rep.companyId === user.companyId;
      },
      insert: async (ctx, rep) => {
        // Students can add reps to their company
        if (user.role === "student") return rep.companyId === user.companyId;
        return user.role === "admin" || user.role === "teacher";
      },
      modify: async (ctx, rep) => {
        // Students can modify their company's reps
        if (user.role === "student" && rep.companyId === user.companyId) return true;
        if (user.role === "teacher") return false;
        return user.role === "admin";
      },
    },

    // Users table (admins and self-access)
    users: {
      read: async (ctx, targetUser) => {
        // Admins read all users
        if (user.role === "admin") return true;
        // Teachers read users in their game
        if (user.role === "teacher" && targetUser.gameId === user.gameId) return true;
        // Students read themselves and teammates
        if (user.role === "student") {
          return targetUser._id === user._id || targetUser.companyId === user.companyId;
        }
        return false;
      },
      insert: () => user.role === "admin", // Only admins create users directly
      modify: async (ctx, targetUser) => {
        // Users can modify their own profile
        if (targetUser._id === user._id) return true;
        // Admins can modify any user
        return user.role === "admin";
      },
    },
  };
}

/**
 * Create custom query and mutation builders with RLS
 * Use these instead of the standard `query` and `mutation` for automatic access control
 */
export const queryWithRLS = customQuery(query, customCtx(async (ctx) => {
  const user = await getCurrentUser(ctx);
  return {
    db: wrapDatabaseReader(ctx, ctx.db, await rlsRules(ctx, user), {
      defaultPolicy: "deny", // Deny access by default, only allow if rule returns true
    }),
    user,
  };
}));

export const mutationWithRLS = customMutation(mutation, customCtx(async (ctx) => {
  const user = await getCurrentUser(ctx);
  return {
    db: wrapDatabaseWriter(ctx, ctx.db, await rlsRules(ctx, user), {
      defaultPolicy: "deny",
    }),
    user,
  };
}));

/**
 * Usage example:
 *
 * export const getMyCompanyDecisions = queryWithRLS({
 *   args: { quarter: v.number() },
 *   handler: async (ctx, { quarter }) => {
 *     // ctx.db is wrapped - RLS rules automatically filter results
 *     const decisions = await ctx.db
 *       .query("hiringDecisions")
 *       .withIndex("by_company_quarter", q =>
 *         q.eq("companyId", ctx.user.companyId).eq("quarter", quarter)
 *       )
 *       .collect();
 *
 *     // If student: only sees their company's decisions
 *     // If teacher: only sees decisions from companies in their game
 *     // If admin: sees all decisions
 *     return decisions;
 *   },
 * });
 */
```

**RLS vs Manual Filtering Tradeoffs:**

| Aspect | RLS (convex-helpers) | Manual Filtering |
|--------|---------------------|------------------|
| **Safety** | Can't bypass enforcement | Easy to forget checks |
| **Performance** | Per-document checks (fast enough) | Optimized queries possible |
| **Code Clarity** | Automatic, centralized | Explicit in each function |
| **Debugging** | Harder to trace denials | Clear error messages |
| **Flexibility** | Rule-based, consistent | Ad-hoc, context-aware |
| **Learning Curve** | Moderate (new pattern) | Simple (if statements) |

**Recommendation for Capo:**

Use **RLS for all data access** with `queryWithRLS` and `mutationWithRLS`, supplemented by manual checks for:
1. **Business logic validation** (e.g., "Can't submit decisions after deadline")
2. **Cross-table operations** (e.g., "Can't fire rep if they're the only one")
3. **Action-specific rules** (e.g., "Teachers can't modify student decisions")

This layered approach ensures:
- ✅ Automatic data filtering at the DB level
- ✅ Clear business rules in domain logic
- ✅ Defense in depth against authorization bugs
- ✅ Type-safe access control throughout the stack

**Pitfalls to Avoid:**
1. **Don't wrap internal functions** - Only wrap public-facing functions that external clients call
2. **Be careful with side effects** - RLS rules run for every document access, avoid expensive operations
3. **Test with different roles** - Verify each role sees only what they should
4. **Document the rules** - Keep the RLS rules well-commented for future maintainers

### Validation Service

```typescript
// convex/services/validation/validation.ts
import { z } from "zod";
import { zCustomQuery, zid } from "convex-helpers/server/zod";
import { query } from "./_generated/server";
import { NoOp } from "convex-helpers/server/customFunctions";

// Define Zod-powered query builder
const zodQuery = zCustomQuery(query, NoOp);

// Hiring decision schema with Zod
export const hiringDecisionSchema = z.object({
  salary: z.number().nonnegative().describe("Annual base salary in USD"),
  commission: z.number().min(0).max(100).describe("Commission percentage (0-100)"),
  benefits: z.enum(["bronze", "silver", "gold"]),
  travel: z.enum(["reps_pay_own", "monthly_per_diem", "unlimited"]),
  perDiem: z.number().optional(),
  hasSalesContest: z.boolean(),
  salesContestType: z.enum(["open", "closed"]).optional(),
  salesContestThreshold: z.number().nonnegative(),
  trainingProductKnowledge: z.number().min(25),
  trainingMarketOrientation: z.number(),
  trainingCompanyOrientation: z.number(),
  trainingSellingTechniques: z.number().min(30),
  numberToHire: z.number().min(0).max(3),
  firingList: z.array(zid("activeReps")),
}).refine(
  (data) =>
    data.trainingProductKnowledge +
    data.trainingMarketOrientation +
    data.trainingCompanyOrientation +
    data.trainingSellingTechniques === 100,
  {
    message: "Training allocation must sum to 100",
    path: ["trainingProductKnowledge"], // Error will be attached to this field
  }
).refine(
  (data) => {
    if (data.travel === "monthly_per_diem") {
      return data.perDiem !== undefined && data.perDiem >= 200;
    }
    return true;
  },
  {
    message: "Per diem must be at least $200 when travel package is monthly per diem",
    path: ["perDiem"],
  }
);

// Usage in queries
export const getHiringDecision = zodQuery({
  args: {
    companyId: zid("companies"),
    quarter: z.number().int().positive(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const decision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", q =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    return decision;
  },
});
```

---

## Frontend Architecture

### Route Structure

TanStack Router file-based routing with type-safe loaders:

```
src/routes/
├── __root.tsx                 # Root layout (ConvexProvider, auth wrapper)
├── index.tsx                  # Landing page
├── login.tsx                  # Magic link login
├── request-access.tsx         # Access request form
├── admin/
│   ├── index.tsx             # Admin dashboard
│   └── access.tsx            # Access management
├── teacher/
│   ├── index.tsx             # Teacher dashboard
│   ├── game.tsx              # Game overview
│   ├── reports.tsx           # Report browser
│   └── compile.tsx           # Compilation trigger
├── student/
│   ├── index.tsx             # Student dashboard
│   ├── company.tsx           # Company view
│   ├── decisions/
│   │   ├── hiring.tsx        # Hiring decision form
│   │   └── leadership.tsx    # Leadership decision form
│   └── rankings/
│       ├── sort.tsx          # Rough sorting phase
│       └── refine.tsx        # Refinement phase
└── reports/
    ├── hiring.tsx            # Hiring outcome report
    ├── leadership.tsx        # Leadership performance report
    └── financials.tsx        # Financial report
```

### Route Loader Pattern

```typescript
// src/routes/student/company.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "../../../hooks/useCurrentUser";

export const Route = createFileRoute("/student/company")({
  loader: async ({ context: { convex } }) => {
    // Preload data for route
    const user = await convex.query(api.users.getCurrent);
    if (!user.companyId) {
      throw new Error("User not assigned to company");
    }

    const [company, game, teammates] = await Promise.all([
      convex.query(api.companies.get, { id: user.companyId }),
      convex.query(api.games.getCurrent, { companyId: user.companyId }),
      convex.query(api.users.listByCompany, { companyId: user.companyId }),
    ]);

    return { company, game, teammates };
  },

  component: CompanyPage,
});

function CompanyPage() {
  const { company, game, teammates } = Route.useLoaderData();
  const presence = usePresence(api.presence, `company-${company._id}`);

  return (
    <div>
      <CompanyHeader company={company} game={game} />
      <TeammateList teammates={teammates} presence={presence} />
      {/* ... */}
    </div>
  );
}
```

### Component Patterns

#### 1. Domain Components (Business Logic)

```typescript
// src/components/domain/DecisionForm.tsx
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFormValidation } from "@/hooks/useFormValidation";
import { hiringDecisionSchema } from "@/convex/services/validation/validation";

export function HiringDecisionForm() {
  const user = useCurrentUser();
  const decision = useQuery(
    api.decisions.hiring.getDraft,
    { companyId: user.companyId, quarter: user.currentQuarter }
  );
  const submit = useMutation(api.decisions.hiring.submit);

  const {
    data,
    errors,
    isValid,
    handleChange
  } = useFormValidation(hiringDecisionSchema, decision ?? {});

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (isValid) {
        submit({ companyId: user.companyId, quarter: user.currentQuarter, data });
      }
    }}>
      <CompensationSection
        data={data}
        errors={errors}
        onChange={handleChange}
      />
      <TrainingSection
        data={data}
        errors={errors}
        onChange={handleChange}
      />
      <SubmitButton disabled={!isValid}>
        {decision?.isSubmitted
          ? `Last submitted by ${decision.submittedBy} at ${new Date(decision.submittedAt).toLocaleString()}`
          : "Submit Decisions"
        }
      </SubmitButton>
    </form>
  );
}
```

#### 2. Shared UI Components (Presentation)

```typescript
// src/components/ui/Input.tsx
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            px-3 py-2 border rounded-md
            focus:outline-none focus:ring-2
            ${error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-sm text-red-600">{error}</span>
        )}
      </div>
    );
  }
);
```

#### 3. Presence-Aware Components

```typescript
// src/components/collaboration/PresenceAwareInput.tsx
import { usePresence } from "@/hooks/usePresence";
import { FacePile } from "@convex-dev/presence/facepile";

interface PresenceAwareInputProps {
  fieldId: string;
  presenceKey: string; // e.g., "company1_hiring_salary"
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
}

export function PresenceAwareInput({
  fieldId,
  presenceKey,
  label,
  value,
  onChange,
}: PresenceAwareInputProps) {
  const { usersWithFocus, lastEdited } = usePresence(presenceKey);
  const hasMultipleFocus = usersWithFocus.length > 1;

  return (
    <div className={`
      relative
      ${hasMultipleFocus ? "ring-2 ring-purple-500 ring-offset-2" : ""}
    `}>
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => updatePresence(presenceKey, "focus")}
        onBlur={() => updatePresence(presenceKey, "blur")}
      />

      {usersWithFocus.length > 0 && (
        <div className="absolute top-0 right-0 -mt-6">
          <FacePile users={usersWithFocus} />
        </div>
      )}

      {lastEdited && (
        <p className="text-xs text-gray-500 mt-1">
          Last edited by {lastEdited.userName} at {lastEdited.timestamp}
        </p>
      )}
    </div>
  );
}
```

### State Management Strategy

**Convex-First**: All server state comes from Convex subscriptions (useQuery).

**Local State**: Use React's built-in useState for:
- Form input values (before validation)
- UI state (modals open/closed, selected tabs)
- Derived client-side data (filtered lists, formatted strings)

**Avoid**: Redux, Zustand, or other global state libraries (Convex replaces most of this).

---

## Authentication & Authorization

### Magic Link Flow

```typescript
// convex/auth/config.ts
import { Auth, customGeneric } from "@convex-dev/auth/server";
import { convex } from "./_generated/server";

export const { auth, signIn, signOut, store } = Auth(convex, {
  providers: [
    {
      id: "magic-link",
      type: "email",
      from: "noreply@yourapp.com",
    },
  ],
});

// Custom callbacks
export const { mutations } = customGeneric<typeof auth>({
  signIn: async (ctx, args) => {
    const { userId, profile } = args;

    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", profile.email))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create user (if approved)
    const request = await ctx.db
      .query("accessRequests")
      .withIndex("by_status", q => q.eq("status", "approved"))
      .filter(q => q.eq(q.field("email"), profile.email))
      .first();

    if (!request) {
      throw new Error("Access not granted. Please request access.");
    }

    const userId = await ctx.db.insert("users", {
      name: profile.name,
      email: profile.email,
      role: request.role,
      gameId: request.requestedGameId,
      companyId: request.requestedCompanyId,
    });

    return userId;
  },
});
```

### Access Control UI

```typescript
// src/components/auth/ProtectedRoute.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function protectedRoute(role?: "admin" | "teacher" | "student") {
  return async ({ context: { convex } }) => {
    const user = await convex.query(api.users.getCurrent);

    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    if (role && user.role !== role && user.role !== "admin") {
      throw redirect({
        to: "/",
        search: { error: "insufficient_permissions" },
      });
    }

    return { user };
  };
}

// Usage
export const Route = createFileRoute("/admin/dashboard")({
  beforeLoad: protectedRoute("admin"),
  component: AdminDashboard,
});
```

---

## Real-Time Collaboration

### Presence Integration

```typescript
// convex/services/presence.ts
import { mutation, query } from "./_generated/server";
import { Presence } from "@convex-dev/presence";
import { components } from "./_generated/api";

const presence = new Presence(components.presence);

export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.id("users"),
    sessionId: v.string(),
    interval: v.number(),
  },
  handler: async (ctx, { roomId, userId, sessionId, interval }) => {
    return await presence.heartbeat(ctx, roomId, userId, sessionId, interval);
  },
});

export const list = query({
  args: { roomToken: v.string() },
  handler: async (ctx, { roomToken }) => {
    return await presence.list(ctx, roomToken);
  },
});

export const updateFocus = mutation({
  args: {
    userId: v.id("users"),
    fieldId: v.string(),
  },
  handler: async (ctx, { userId, fieldId }) => {
    // Update user's focused field
    const presence = await ctx.db
      .query("userPresence")
      .withIndex("by_user", q => q.eq("userId", userId))
      .first();

    if (presence) {
      await ctx.db.patch(presence._id, { focusedField: fieldId });
    }
  },
});
```

### React Hooks

```typescript
// src/hooks/usePresence.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useEffect, useRef } from "react";

export function usePresence(roomKey: string) {
  const heartbeat = useMutation(api.presence.heartbeat);
  const presence = useQuery(api.presence.list, { roomToken: roomKey });

  const sessionId = useRef(crypto.randomUUID());
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Start heartbeat
    intervalRef.current = setInterval(() => {
      heartbeat({
        roomId: roomKey,
        userId: "current-user-id", // From auth
        sessionId: sessionId.current,
        interval: 10000, // 10 seconds
      });
    }, 10000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [roomKey, heartbeat]);

  return {
    onlineUsers: presence ?? [],
    isOnline: (userId: string) => presence?.some(p => p.userId === userId),
  };
}
```

---

## Testing Strategy

### Testing Pyramid

```
       ╱╲
      ╱  ╲
     ╱ E2E ╲       ← Vitest browser mode (few, critical paths)
    ╱──────╲
   ╱        ╲
  ╱ Integration ╲    ← Vitest + convex-test (domain logic)
 ╱────────────╲
╱              ╲
   Unit Tests      ← Vitest (pure functions, validation)
```

### Test Environments

The project uses **Vitest** with environment-specific test runners:

```typescript
// vitest.config.mts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    environmentMatchGlobs: [
      ["convex/**", "edge-runtime"],  // Convex tests run in edge-runtime
      ["**", "jsdom"],                 // React tests use jsdom
    ],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
```

**Testing Modes:**
1. **Unit Tests** (`*.test.ts`) - Vitest with jsdom/edge-runtime
2. **Integration Tests** - Vitest + convex-test for backend logic
3. **E2E Tests** - Vitest browser mode for critical user flows

### Convex Testing Pattern

```typescript
// convex/services/decisions/hiring.test.ts
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../../_generated/api";
import schema from "../../schema";

test("submit hiring decision - validates training allocation", async () => {
  const t = convexTest(schema);

  // Setup
  const gameId = await t.runMutation(api.games.test.create, {
    name: "Test Game",
    currentQuarter: 1,
    currentPhase: "hiring",
  });

  const companyId = await t.runMutation(api.companies.test.create, {
    gameId,
    industry: "A",
    name: "Company 1",
  });

  // Act
  const result = t.runMutation(api.decisions.hiring.submit, {
    companyId,
    quarter: 1,
    data: {
      salary: 50000,
      commission: 5,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      // ... other fields
    },
  });

  // Assert
  await expect(result).resolves.toBeDefined();

  const decision = await t.runQuery(api.decisions.hiring.get, {
    companyId,
    quarter: 1,
  });

  expect(decision?.isSubmitted).toBe(true);
});

test("submit hiring decision - rejects invalid training sum", async () => {
  const t = convexTest(schema);

  // Setup (same as above)

  // Act & Assert
  await expect(
    t.runMutation(api.decisions.hiring.submit, {
      companyId,
      quarter: 1,
      data: {
        salary: 50000,
        commission: 5,
        trainingProductKnowledge: 50, // Sum > 100
        trainingMarketOrientation: 50,
        trainingCompanyOrientation: 10,
        trainingSellingTechniques: 10,
      },
    })
  ).rejects.toThrow("Training allocation must sum to 100");
});
```

### React Component Testing

```typescript
// src/components/domain/HiringDecisionForm.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HiringDecisionForm } from "./HiringDecisionForm";
import { convexTest } from "convex-test";

describe("HiringDecisionForm", () => {
  it("renders form with initial data", async () => {
    const t = convexTest(schema);

    // Mock Convex queries
    vi.mock("convex/react", () => ({
      useQuery: vi.fn(() => ({
        salary: 50000,
        commission: 5,
      })),
      useMutation: vi.fn(() => vi.fn()),
    }));

    render(<HiringDecisionForm />);

    expect(screen.getByLabelText(/salary/i)).toHaveValue(50000);
    expect(screen.getByLabelText(/commission/i)).toHaveValue(5);
  });

  it("validates training allocation sum", async () => {
    render(<HiringDecisionForm />);

    const productKnowledge = screen.getByLabelText(/product knowledge/i);
    const sellingTechniques = screen.getByLabelText(/selling techniques/i);

    // Set invalid values (sum > 100)
    await userEvent.type(productKnowledge, "50");
    await userEvent.type(sellingTechniques, "60");

    expect(screen.getByText(/must sum to 100/i)).toBeInTheDocument();
  });
});
```

### Test Utilities

```typescript
// convex/test/testHelpers.ts
import { convexTest } from "convex-test";
import schema from "../schema";

export async function setupTestGame(t: any) {
  const gameId = await t.runMutation(api.games.test.create, {
    name: "Test Game",
    currentQuarter: 1,
    currentPhase: "hiring",
    length: 4,
  });

  const company1 = await t.runMutation(api.companies.test.create, {
    gameId,
    industry: "A",
    name: "Company A1",
  });

  const company2 = await t.runMutation(api.companies.test.create, {
    gameId,
    industry: "A",
    name: "Company A2",
  });

  const student1 = await t.runMutation(api.users.test.create, {
    name: "Student 1",
    email: "student1@test.com",
    role: "student",
    gameId,
    companyId: company1,
  });

  return { gameId, company1, company2, student1 };
}

// Usage
test("teacher can view all companies", async () => {
  const t = convexTest(schema);
  const { gameId, company1, company2 } = await setupTestGame(t);

  const companies = await t.runQuery(api.companies.listByGame, { gameId });

  expect(companies).toHaveLength(2);
});
```

---

## Error Handling & Resilience

### Error Categories

1. **Validation Errors**: Client-side form validation (show inline errors)
2. **Authorization Errors**: Redirect to login or show "access denied"
3. **Not Found Errors**: Show friendly 404 page
4. **Network Errors**: Retry with exponential backoff
5. **Server Errors**: Log to Convex dashboard, show generic error message

### Error Boundary

```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error boundary caught:", error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
          <p className="text-gray-600 mt-2">
            {this.state.error?.message ?? "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Convex Error Handling

```typescript
// convex/services/errors.ts
import { MutationCtx } from "./_generated/server";

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Access denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessLogicError";
  }
}

// Usage in mutations
export const submitDecision = mutation({
  args: { /* ... */ },
  handler: async (ctx, args) => {
    // Validate
    if (args.data.numberToHire > 3) {
      throw new ValidationError("numberToHire", "Cannot hire more than 3 reps");
    }

    // Check authorization
    const user = await getCurrentUser(ctx);
    if (!canAccessCompany(user, args.companyId)) {
      throw new AuthorizationError();
    }

    // Business logic
    const currentTeam = await ctx.db
      .query("activeReps")
      .withIndex("by_company_quarter", q =>
        q.eq("companyId", args.companyId).eq("quarter", args.quarter)
      )
      .collect();

    if (currentTeam.length - args.data.firingList.length < 3) {
      throw new BusinessLogicError("Cannot fire below minimum team size (3)");
    }

    // ... proceed with submission
  },
});
```

---

## Deployment & DevOps

### Environment Variables

```bash
# .env.local (development)
VITE_CONVEX_URL=http://localhost:3210

# Convex Dashboard (production)
CONVEX_DEPLOYMENT=prod
CONVEX_PRODUCTION_URL=https://your-app.convex.site

# Auth (set in Convex Dashboard)
SENDGRID_API_KEY=sg.xxx
FROM_EMAIL=noreply@yourapp.com
```

### Build & Deploy

```bash
# Development
npm run dev                # Start Vite + Convex dev

# Production Build
npm run build             # Build React app
npm run deploy            # Deploy to Convex
```

### Convex Configuration

```typescript
// convex.config.ts
import { defineApp } from "convex/server";
import presence from "@convex-dev/presence/convex.config.js";

const app = defineApp();
app.use(presence);

export default app;
```

---

## Development Workflow

### Local Development

1. **Start Dev Server**: `npm run dev` (runs Vite + Convex dev in parallel)
2. **Write Tests**: `npm test` (Vitest watch mode)
3. **Type Check**: `npm run typecheck` (TypeScript compiler)
4. **Lint**: `npm run lint` (ESLint)

### Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/hiring-decision-form
git commit -m "feat: add hiring decision form with validation"
git push origin feature/hiring-decision-form
# Create PR, review, merge to main
```

### Commit Convention

- `feat`: New feature (e.g., "feat: add resume ranking interface")
- `fix`: Bug fix (e.g., "fix: validation error on training allocation")
- `refactor`: Code change without functional change
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Build process or dependencies

---

## Appendix: Code Examples

### Example 1: Complete Decision Flow

```typescript
// 1. Domain Service (Convex with RLS)
// convex/domain/decisions/hiring.ts
import { mutation, query } from "../../_generated/server";
import { zCustomMutation, zCustomQuery, zid } from "convex-helpers/server/zod";
import { NoOp } from "convex-helpers/server/customFunctions";
import { queryWithRLS, mutationWithRLS } from "../../services/rowLevelSecurity";
import { hiringDecisionSchema } from "../../services/validation/validation";
import { z } from "zod";

// Use Zod-powered query builder with RLS
const zodQuery = zCustomQuery(query, NoOp);
const zodMutation = zCustomMutation(mutation, NoOp);

export const getDraft = zodQuery({
  args: {
    companyId: zid("companies"),
    quarter: z.number().int().positive(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    // ctx.db is wrapped with RLS - user can only access their company's decisions
    const decision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", q =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    // Return draft or create default
    return decision ?? {
      salary: 50000,
      commission: 5,
      benefits: "bronze",
      travel: "reps_pay_own",
      hasSalesContest: false,
      trainingProductKnowledge: 25,
      trainingMarketOrientation: 25,
      trainingCompanyOrientation: 25,
      trainingSellingTechniques: 25,
      numberToHire: 0,
      firingList: [],
    };
  },
});

export const saveDraft = zodMutation({
  args: {
    companyId: zid("companies"),
    quarter: z.number().int().positive(),
    data: hiringDecisionSchema.partial(), // Allow partial updates for drafts
  },
  handler: async (ctx, { companyId, quarter, data }) => {
    // Validate with Zod
    const validatedData = hiringDecisionSchema.partial().parse(data);

    // Check if draft exists
    const existing = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", q =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...validatedData, isSubmitted: false });
      return existing._id;
    }

    return await ctx.db.insert("hiringDecisions", {
      companyId,
      quarter,
      ...validatedData,
      isSubmitted: false,
    });
  },
});

export const submit = mutationWithRLS({
  args: {
    companyId: zid("companies"),
    quarter: z.number().int().positive(),
  },
  handler: async (ctx, { companyId, quarter }) => {
    const decision = await ctx.db
      .query("hiringDecisions")
      .withIndex("by_company_quarter", q =>
        q.eq("companyId", companyId).eq("quarter", quarter)
      )
      .first();

    if (!decision) {
      throw new Error("No draft to submit");
    }

    // Re-validate with Zod
    hiringDecisionSchema.parse(decision);

    // Business logic checks
    if (decision.numberToHire > 0 && !decision.hiringList?.length) {
      throw new Error("Must create hiring list before submitting");
    }

    await ctx.db.patch(decision._id, {
      isSubmitted: true,
      submittedBy: ctx.user._id,
      submittedAt: Date.now(),
    });

    return decision._id;
  },
});
```

```typescript
// 2. React Component with Zod validation
// src/components/domain/hiring/HiringDecisionForm.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useFormValidation } from "@/hooks/useFormValidation";
import { hiringDecisionSchema } from "@/convex/services/validation/validation";
import { PresenceAwareInput } from "@/components/collaboration/PresenceAwareInput";
import { z } from "zod";

export function HiringDecisionForm() {
  const user = useCurrentUser();
  const draft = useQuery(
    api.decisions.hiring.getDraft,
    { companyId: user.companyId, quarter: user.currentQuarter }
  );
  const saveDraft = useMutation(api.decisions.hiring.saveDraft);
  const submit = useMutation(api.decisions.hiring.submit);

  const {
    data,
    errors,
    isValid,
    handleChange
  } = useFormValidation(hiringDecisionSchema, draft ?? {});

  // Auto-save on change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (data && isValid) {
        saveDraft({
          companyId: user.companyId,
          quarter: user.currentQuarter,
          data,
        });
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [data, isValid]);

  if (!draft) return <div>Loading...</div>;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      submit({
        companyId: user.companyId,
        quarter: user.currentQuarter,
      });
    }}>
      <CompensationSection
        data={data}
        errors={errors}
        onChange={handleChange}
      />
      <TrainingSection
        data={data}
        errors={errors}
        onChange={handleChange}
      />
      <HiringSection
        companyId={user.companyId}
        quarter={user.currentQuarter}
        data={data}
        errors={errors}
        onChange={handleChange}
      />
      <SubmitButton
        disabled={!isValid || draft.isSubmitted}
        submittedBy={draft.submittedBy}
        submittedAt={draft.submittedAt}
      />
    </form>
  );
}
```

### Example 2: Teacher Dashboard

```typescript
// src/routes/teacher/game.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { CompanyCard } from "@/components/domain/CompanyCard";
import { FacePile } from "@convex-dev/presence/facepile";

export const Route = createFileRoute("/teacher/game")({
  loader: protectedRoute("teacher"),
  component: TeacherGameView,
});

function TeacherGameView() {
  const { gameId } = Route.useSearch();
  const game = useQuery(api.games.get, { id: gameId });
  const companies = useQuery(api.companies.listByGame, { gameId });
  const submissions = useQuery(api.decisions.listSubmissions, { gameId });

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">{game?.name}</h1>
      <p>Quarter {game?.currentQuarter} - {game?.currentPhase} Phase</p>

      <div className="grid grid-cols-3 gap-4 mt-8">
        {companies?.map((company) => (
          <CompanyCard
            key={company._id}
            company={company}
            submitted={submissions?.[company._id] ?? false}
            presence={usePresence(`company-${company._id}`)}
          />
        ))}
      </div>

      <CompileButton gameId={gameId} quarter={game?.currentQuarter} />
    </div>
  );
}
```

---

## Next Steps

1. **Implement Convex Schema**: Translate this architecture into `convex/schema.ts`
2. **Set Up Auth**: Configure `@convex-dev/auth` with magic links
3. **Build Domain Services**: Implement `convex/domain/*` functions
4. **Create React Components**: Build UI with TanStack Router
5. **Write Tests**: Cover critical paths with Vitest + convex-test
6. **Deploy**: Set up Convex production deployment
7. **Iterate**: Gather feedback and refine

---

**Document End**

For questions or clarifications, refer to:
- `/data/projects/capo/openspec/mvp-requirements-overview.md` - Detailed requirements
- `/data/projects/capo/.claude/docs/convex/components.md` - Convex component docs
- `/data/projects/capo/.claude/docs/testing/vitest-convex-test.md` - Testing guide
