# Convex MVP Build - One-Shot Prompt

**Build a business simulation platform where students make hiring and leadership decisions. Teachers manage access and compile results.**

---

## Tech Stack

- **Convex**: Backend, database, real-time sync
- **Convex Auth**: Magic-link authentication (`@convex-dev/auth` with `@auth/magic-link` provider)
- **@convex-dev/presence**: Real-time user presence for collaboration
- **Frontend**: React with Convex hooks (`useQuery`, `useMutation`)
- **Routing**: TanStack Router v1+ (file-based routing)

---

## Routing Structure

Use TanStack Router in file-based mode (`vite-plugin-tsconfig-paths` for route generation).

### Route Tree

```
src/routes/
├── __root.tsx                    // Layout with ConvexProvider
├── index.tsx                     // Redirect to /login or /dashboard
├── login.tsx                     // Magic link login form
├── request-access.tsx            // Public access request form
├── admin.access.tsx              // Admin dashboard (teacher/student access)
├── decisions.$quarterId.tsx      // Decision entry (hiring or leadership)
├── reports.$quarterId.$type.tsx  // Student reports
├── teacher.reports.$gameId.$quarterId.$type.tsx  // Teacher reports
├── rank-resumes.$gameId/
│   ├── rough.tsx                 // Phase 1: rough sorting
│   └── refine.tsx                // Phase 2: drag-drop refinement
└── dashboard.tsx                 // Role-based redirect destination
```

### Route Guards

Create a `protectedRoute` utility in `__root.tsx`:

```typescript
// Check auth and redirect appropriately
// Students → decision entry or reports
// Teachers → teacher dashboard
// Admins → admin dashboard
```

### Loaders

Use TanStack Router's `beforeLoad` to fetch Convex data before rendering:

```typescript
beforeLoad: async ({ context }) => {
  const quarter = await context.convex.query(api.quarters.get, { id });
  if (!quarter) throw redirect({ to: '/dashboard' });
  return { quarter };
}
```

---

## Database Schema

### Users
```typescript
// Auth handles identity, this stores game-specific data
fields: {
  email: v.string(),
  name: v.string(),
  role: v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
  gameId: v.optional(v.id("games")),  // Teachers/students only
  companyId: v.optional(v.id("companies")),  // Students only
}
```

### Access Requests
```typescript
fields: {
  name: v.string(),
  email: v.string(),
  role: v.union(v.literal("teacher"), v.literal("student")),
  status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
  createdAt: v.number(),
}
```

### Games
```typescript
fields: {
  name: v.string(),
  industry: v.string(),  // Groups parallel non-competing companies
  createdBy: v.id("users"),
  createdAt: v.number(),
}
```

### Companies
```typescript
fields: {
  gameId: v.id("games"),
  name: v.string(),
  industry: v.string(),
  studentCount: v.number(),  // Track for balancing
}
```

### Quarters
```typescript
fields: {
  gameId: v.id("games"),
  quarterNumber: v.integer(),
  currentPhase: v.union(v.literal("hiring"), v.literal("leadership"), v.literal("complete")),
  hiringCompiled: v.boolean(),
  leadershipCompiled: v.boolean(),
}
```

### Reps (Sales Representatives)
```typescript
fields: {
  gameId: v.id("games"),
  name: v.string(),
  companyId: v.optional(v.id("companies")),  // null = in hiring pool
  territory: v.optional(v.string()),  // County/territory name

  // Performance fields (generated after compilation)
  sales: v.optional(v.number()),
  calls: v.optional(v.number()),
  daysWorked: v.optional(v.number()),
  battingAvg: v.optional(v.number()),

  // Leadership behavior (for leadership decisions)
  correctLeadershipBehavior: v.string(),  // One of: Praise, Punishment, Rules, Goals, Support
  incorrectLeadershipBehavior: v.string(),

  // Hiring metadata
  poachable: v.boolean(),  // Cannot be poached in Q1
  justPoached: v.boolean(),  // Cannot be poached if just hired
}
```

### Hiring Decisions
```typescript
fields: {
  gameId: v.id("games"),
  companyId: v.id("companies"),
  quarter: v.id("quarters"),

  // Compensation
  salary: v.integer(),  // Annual USD
  commission: v.integer(),  // Percentage 0-100
  sales_contest: v.integer(),  // 0=none, 1=knives, 2=$1k, 3=trip
  sales_contest_threshold: v.integer(),
  sales_contest_is_open: v.boolean(),
  benefits: v.integer(),  // 1=bronze, 2=silver, 3=gold
  travel: v.integer(),  // 1=own, 2=perdiem, 3=unlimited
  per_diem: v.optional(v.integer()),  // Required when travel=2

  // Training (percentages summing to 100)
  training_product_knowledge: v.number(),
  training_market_orientation: v.number(),
  training_company_orientation: v.number(),
  training_selling_techniques: v.number(),

  // Hiring
  num_to_hire: v.integer(),  // 0-3
  hiring_list: v.array(v.id("reps")),  // Combined rankings
  firing: v.array(v.id("reps")),

  // Submission tracking
  lastSubmittedBy: v.optional(v.id("users")),
  lastSubmittedAt: v.optional(v.number()),
}
```

### Leadership Decisions
```typescript
fields: {
  gameId: v.id("games"),
  companyId: v.id("companies"),
  quarter: v.id("quarters"),

  // Territory assignments: { "repId": ["county1", "county2"] }
  territoryAssignments: v.record(v.string(), v.array(v.string())),

  // Time allocation (percentages summing to 100)
  time_recruiting: v.number(),
  time_meeting_customers: v.number(),
  time_sales_planning: v.number(),
  time_administrative_paperwork: v.number(),

  // Individual hours: { "repId": hours }
  individualHours: v.record(v.string(), v.number()),

  // Leadership behaviors: { "repId": "Praise" | "Punishment" | ... }
  leadershipBehaviors: v.record(v.string(), v.string()),

  // Market reports
  compensation_report: v.boolean(),
  salesrep_report: v.boolean(),
  territory_report: v.boolean(),

  // Submission tracking
  lastSubmittedBy: v.optional(v.id("users")),
  lastSubmittedAt: v.optional(v.number()),
}
```

### Resume Rankings (Private per student)
```typescript
fields: {
  userId: v.id("users"),
  gameId: v.id("games"),
  repId: v.id("reps"),
  tier: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
  position: v.integer(),  // Position within tier (0 = top)
  updatedAt: v.number(),
}
```

### Submitted Decisions (Immutable snapshot)
```typescript
// Same structure as Hiring/Leadership decisions but immutable
// Created when student submits, used by compilation
```

### Compilation Results
```typescript
fields: {
  gameId: v.id("games"),
  quarter: v.id("quarters"),
  compilationType: v.union(v.literal("hiring"), v.literal("leadership")),
  compiledAt: v.number(),
  compiledBy: v.id("users"),

  // Hiring results
  hiringOutcomes: v.optional(v.object({
    poached: v.array(v.id("reps")),
    retained: v.array(v.id("reps")),
    hired: v.array(v.id("reps")),
  })),

  // Leadership results (stubbed random data)
  repPerformance: v.optional(v.array(v.object({
    repId: v.id("reps"),
    sales: v.number(),
    calls: v.number(),
    daysWorked: v.number(),
    battingAvg: v.number(),
  }))),

  financialReports: v.optional(v.array(v.object({
    companyId: v.id("companies"),
    total_rep_salaries: v.number(),
    total_commissions: v.number(),
    total_benefits: v.number(),
    total_expenses: v.number(),
    gross_margin: v.number(),
    net_income: v.number(),
  }))),
}
```

---

## Feature 1: Authentication & Access Control

### Setup Convex Auth

Install and configure `@convex-dev/auth` with magic-link provider.

### Routes

1. **`/login`**: Email input form. Submitting calls auth mutation to send magic link.
2. **`/request-access`**: Public form (no auth required). Fields: name, email, role (teacher/student). Creates access request.
3. **`/admin/access`**: Admin-only dashboard with two tabs.

### Admin Dashboard

**Pending Requests Tab**:
- List all requests with `status: "pending"`
- Each row shows: name, email, role, [Approve] [Deny] buttons
- Approve opens modal: select game, select industry, select company (auto-select to least-populated for students)
- Deny requires confirmation

**Direct Grant Tab**:
- Form: email, role, game selector, company selector (for students)
- Creates user and grants access immediately

### Access Rules

Use Convex's `ctx.auth.getUserIdentity()` for all authorization:

```typescript
// Example: Check user role and access
export const query = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db.query("users")
      .withIndex("by_email", q => q.eq(identity.email))
      .unique();

    if (!user || user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    // Return teacher's data only
  }
});
```

### Role Permissions

- **Admin**: Access `/admin/access`, no game assignment
- **Teacher**: Access to specific `gameId`, view all companies in their game
- **Student**: Access to specific `companyId`, view only their company's data

---

## Feature 2: Real-Time Presence

### Setup @convex-dev/presence

Follow component docs. Create `convex/presence.ts`:

```typescript
export const heartbeat = mutation({
  args: {
    roomId: v.string(),
    userId: v.string(),
    // ... other presence args
  },
  handler: async (ctx, args) => {
    // Use presence component
  }
});
```

### Student Presence (Company View)

Each company has a presence room: `company:{companyId}`.

**Header**:
- Use `usePresence` hook from `@convex-dev/presence/react`
- Show avatars of online teammates
- Hover tooltip shows offline teammates
- Fixed-size container prevents layout shift

**Cursors**:
- Each user gets assigned a color (hash their userId to color)
- Show cursor position on page when editing
- Store cursor positions in presence metadata

**Input Focus**:
- When multiple users focus same input, show all avatars top-right
- Apply unique "multiple focus" border color
- Show "Last edited by {name} at {time}" below input

### Teacher Presence (Dashboard)

Room: `game:{gameId}`

**Company Cards**:
- Show online count with avatars
- Tooltip on hover shows offline students
- Fixed-size presence area

---

## Feature 3: Decision-Making Flow

### Decision Entry

Route: `/decisions/:quarterId`

Loads current quarter's phase. Shows different forms based on phase.

**Data Loading**:
- Query quarter by ID
- Query existing decisions for company+quarter
- Query current team (different for hiring vs leadership)

**Current Team Logic**:
- **Hiring phase**: Team from *previous* quarter (pre-draft)
- **Leadership phase**: Team from *current* quarter (post-draft)
- Use rep's `companyId` to determine team membership

### Auto-Save

Create drafts collection for working decisions. Use Convex mutations to save on every change.

No submit button required for auto-save.

### Validation

Use Convex validators:

```typescript
const hiringDecisionValidator = {
  salary: v.min(v.integer(), 0),
  commission: v.min(v.integer(), 0),
  sales_contest: v.integer(),
  // ... etc
}
```

Validate client-side before enabling submit button.

### Submission

Submit button disabled until validation passes.

Show: "Last submitted by {user} at {timestamp}" below button (query from decision document).

On submit:
1. Client validates all data
2. Call mutation `submitHiringDecisions` or `submitLeadershipDecisions`
3. Mutation validates server-side (never trust client)
4. Copy data to `submittedHiringDecisions` or `submittedLeadershipDecisions` collection
5. Update `lastSubmittedBy` and `lastSubmittedAt` on working document

### Resubmission

Students can resubmit anytime before teacher compiles. In-place update, no history.

---

## Feature 4: Reports & Historical Data

### Student Reports

Route: `/reports/:quarterId/:type`

**Access Control**:
- Query student's company from user document
- Only return decisions and results for that company
- Teachers see all companies; students see only theirs

**Report Types**:
- `hiring-outcomes`: Who was hired, fired, poached
- `financials`: Company financial report
- `rep-performance`: Individual rep stats

### Teacher Reports

Route: `/teacher/reports/:gameId/:quarterId/:type`

**Navigation**:
- Group by industry (orthogonal grouping)
- Show all companies in game
- Cross-industry comparison views

**Rollup Reports**:
- Aggregate data across all companies
- Compare performance metrics

### Report Queries

Standard Convex queries with appropriate indexes:

```typescript
export const getHiringOutcomes = query({
  args: { quarterId: v.id("quarters") },
  handler: async (ctx, args) => {
    const quarter = await ctx.db.get(args.quarterId);
    const results = await ctx.db.query("compilationResults")
      .withIndex("by_quarter_and_type", q =>
        q.eq("quarter", args.quarterId).eq("compilationType", "hiring")
      )
      .first();

    return results?.hiringOutcomes;
  }
});
```

---

## Feature 5: Resume Ranking

### Two-Phase Flow

#### Phase 1: Rough Sort

Route: `/rank-resumes/:gameId/rough`

- Show unranked reps one-by-one
- Each rep has A/B/C buttons
- Clicking assigns to tier and moves to next rep
- Progress bar shows position

#### Phase 2: Refinement

Route: `/rank-resumes/:gameId/refine`

- Show three columns (A/B/C) simultaneously
- Drag and drop within and between columns
- Rankings persist until changed

### Data Model

Each student has private `ResumeRankings` documents:

```typescript
{
  userId: currentUserId,
  gameId: currentGameId,
  repId: rep._id,
  tier: "A" | "B" | "C",
  position: 0,  // Position within tier
  updatedAt: Date.now()
}
```

### Collaboration

- Each student has their own rankings (query by `userId`)
- Real-time view of teammates' rankings (query all rankings for `gameId`)
- Combined hiring list generated when student submits hiring decisions

### Hiring List Generation

When submitting hiring decisions, combine all students' rankings:

```typescript
// Algorithm (simplified for MVP):
1. For each rep, count how many students ranked them A/B/C
2. Weight: A=3pts, B=2pts, C=1pt
3. Sort by total points descending
4. This becomes the company's hiring_list
```

---

## Feature 6: Compilation (Stubbed)

### Constants

Preserve these exact values from legacy:

```javascript
COST_OF_GOODS = 0.65
TOTAL_PERFORMANCE = 40
MIN_REPS = 3
MAX_HIRE_COUNT = 3
MANAGER_COMMISSION = 0.02
MANAGER_SALARY_QTR = 20000
MANAGER_TRAVEL_QTR = 750
TERMINATION_EXPENSES = 15000
TRAINING_EXPENSES = 6000
CLERICAL_EXPENSES = 10000
RENT_AND_UTILITIES = 7500
LEGAL_AND_OTHER = 10000
SALESREP_REPORT_COST = 10000
COMPENSATION_REPORT_COST = 10000
```

### Hiring Compilation

Action: `compileHiringDecisions(gameId, quarterId)`

**Teacher-Only Check**: Verify caller is teacher for this game.

**Validation**:
- Check all companies have submitted (or teacher confirms proceed with defaults)
- Validate firing doesn't go below MIN_REPS
- Validate num_to_hire ≤ MAX_HIRE_COUNT

**Process**:
1. Calculate attractiveness index per company (based on compensation package)
2. Run draft: companies hire from combined hiring_list in attractiveness order
3. **Generate dummy outcomes** with semantic constraints:
   - Can't hire someone already on your team
   - Can't hire someone already hired by higher-attractiveness company
   - Respect poaching rules (no poaching Q1, no just-poached reps, minimum team size)
4. Update rep `companyId` fields
5. Write results to `compilationResults`
6. Mark quarter `hiringCompiled = true`

### Leadership Compilation

Action: `compileLeadershipDecisions(gameId, quarterId)`

**Validation**:
- Check all companies submitted

**Generate Dummy Data**:
- For each rep: random sales, calls, daysWorked, battingAvg
- For each company: calculate financials from rep performance
- Respect market report costs (deduct from financials)

**Write Results**:
- Save to `compilationResults`
- Mark quarter `leadershipCompiled = true`

---

## Validation Rules

### Hiring Decisions

```typescript
// Compensation
salary >= 0  // Default $20,000 first decision
commission >= 0 && commission <= 100
sales_contest in [0, 1, 2, 3]
if sales_contest > 0: sales_contest_threshold > 0
benefits in [1, 2, 3]
travel in [1, 2, 3]
if travel === 2: per_diem >= 200

// Training (sum to 100)
training_product_knowledge + training_market_orientation +
  training_company_orientation + training_selling_techniques === 100
training_product_knowledge >= 25
training_selling_techniques >= 30

// Hiring
num_to_hire in [0, 1, 2, 3]
hiring_list.length > 0
firing: validate each ID exists and belongs to this company
team.length - firing.length >= MIN_REPS
```

### Leadership Decisions

```typescript
// Territory assignments
All counties assigned
Every rep gets >= 1 county
Counties per rep are contiguous

// Time allocation (sum to 100)
time_recruiting + time_meeting_customers +
  time_sales_planning + time_administrative_paperwork === 100
time_recruiting >= 5
time_meeting_customers >= 5
time_sales_planning >= 5

// Individual hours
Base hours = (time_administrative_paperwork / 100) * 650
Sum(individual_hours[repId] for repId in reps) === Base hours
individual_hours[repId] >= 0

// Leadership behaviors
Each rep gets one of: Praise, Punishment, Rules, Goals, Support
```

---

## Industry Structure

**Key Concept**: Industries contain parallel, non-interacting company groups.

- Companies in Industry A compete only with each other
- Companies in Industry B compete only with each other
- Industries compile independently but simultaneously
- Teacher dashboard groups companies by industry

Schema impact:
- `games.industry`: String identifier
- `companies.industry`: Copy from game
- All queries filter by industry for teacher views

---

## Next Actions for Builder

1. Define complete schema in `schema.ts`
2. Set up Convex Auth with magic-link provider
3. Install and configure @convex-dev/presence
4. Build authentication flows (login, request access, admin dashboard)
5. Implement presence for students and teachers
6. Build decision entry forms with auto-save and validation
7. Implement submission flow with server-side validation
8. Build resume ranking (rough sort + refinement)
9. Implement stubbed compilation actions
10. Build report views for students and teachers

Start with auth and schema. Everything builds on that foundation.

---

## Parallel Orchestration Protocol (2026-02-03)

**Purpose:** Run multiple independent work streams in parallel with crash recovery.

### Minimal Comment Structure

Four comment types for beads:

1. **CLAIM** - When starting work
   ```
   CLAIM: 2026-02-03T16:30:00Z - Implementing E2E-01 auth test
   ```

2. **PLAN** - Before taking action
   ```
   PLAN: Create test file, implement 7 scenarios, verify all pass
   ```

3. **UPDATE** - As work progresses (CRITICAL for crash recovery)
   ```
   UPDATE: Created fixtures.ts (219 lines) | Next: page-objects.ts
   ```

4. **COMPLETE** - When done
   ```
   COMPLETE: 7/7 tests passing (1.30s). All acceptance criteria met.
   ```

### Crash Recovery

**Pattern:** UPDATE comments use `| Next: <action>`

After crash or handoff:
1. Read last UPDATE comment
2. Execute the "Next" part (right of `|`)
3. Add new UPDATE with your next "Next"

**Why it works:** Current state on left, immediate action on right - no history needed.

### When to Use Parallel Orchestration

- **Use:** Independent tasks (no shared state, no dependencies)
- **Avoid:** Sequential work, shared mutable state
- **Limit:** Max 3-4 parallel tracks (context window)

### Tools

```bash
# Parent-child structure
br dep add <track> <epic> --type=parent-child

# Monitoring
bd activity --follow --mol <epic-id>

# Status checks
br list --status=in_progress
br epic status
```

### Skill Location

- Definition: `/home/ubuntu/.claude/skills/parallel-orchestration/skill.md`
- Integrated into: `memory-bank/CONVEX_ONESHOT.md` (this section)
