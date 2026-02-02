# MVP Testing Candidate - Refined Requirements Overview

**Last Updated:** 2026-02-01
**Status:** Requirements Complete - Pending Architecture Design

---

## Section 1: Authentication & Access Control

**Scope**: Magic-link authentication with admin-controlled access. No game creation or roster management - games are seeded directly.

**User Flows**:
1. **Request Access** (`/request-access`): Public form with name, email, role (teacher/student). Creates pending request.
2. **Login** (`/login`): Existing users enter email, receive magic link.
3. **Admin Dashboard** (`/admin/access`): Two-tab interface:
   - **Pending Requests Tab**: List of requests with Approve/Deny. Approve opens modal to select game/industry/company (company auto-selects to least-populated for students).
   - **Direct Grant Tab**: Form to grant access to any email without a pending request (same selectors).

**Roles**: admin (hand-written), teacher, student. Permissions scoped to specific games (teachers see all games; students see only their assigned company).

---

## Section 2: Real-Time Collaboration & Presence

**Scope**: Students collaborate on decisions within their company. Teachers monitor activity across all companies.

**Student Presence** (company view):
- Header shows online teammates with avatars
- Offline teammates shown in **tooltip** (not click-to-expand)
- **Grid card presence section has fixed size** (no layout shift when students come/go)
- User cursors visible on page (each user assigned a color)
- Input focus: When multiple users focus an input, show all avatars top-right, unique "multiple focus" border color, and "Last edited by User at HH:MM:SS" below

**Teacher Presence** (dashboard):
- Company-focused grid
- Each company card shows: online count with avatars, submitted status badge
- Offline students visible via **tooltip** on hover
- **Fixed-size presence area** prevents layout shift

---

## Section 3: Decision-Making Flow

**Scope**: Students collaborate on hiring and leadership decisions. Data persists across compilations.

**Data Architecture**:
- All decision data stored on rep documents (firing status, territories, leadership behaviors, individual hours)
- No snapshots - all data live and reactive via RxDB hooks
- "Current team" for hiring decisions = team from previous quarter (pre-draft)
- "Current team" for leadership decisions = team from current quarter (post-draft)
- Decision entry page dynamically loads based on **current quarter** AND **decision phase** ('hiring' or 'leadership')

**Submission Flow**:
- Working decisions auto-save (persisted across compilations)
- Real-time validation via RxDB JSON Schema + AJV
- Submit button disabled until client-side validation passes
- **"Last submitted by <user> at <date-timestamp>" displayed beneath submit button**
- **Submit calls Firebase Cloud Function** (students have NO write access to submitted decisions)
- **Backend re-validates all data** and copies to "submitted" collection
- Students can re-submit unlimited times until teacher compiles (in-place override, no history)

---

## Section 4: Reports & Historical Data

**Scope**: Students and teachers view all past decisions and outcome reports. Teachers get cross-company rollups.

**Student Reports**:
- View only their own company's decisions and outcomes
- RxDB replication filter enforces access policy
- Reports available: hiring outcomes, financial reports, rep performance
- Navigate by quarter/decision type

**Teacher Reports**:
- View **all companies** within **their simulation**
- Organized by **industry** (orthogonal groups - companies in Industry A don't compete with Industry B)
- Cross-industry comparison views
- Rollup reports across all companies in simulation
- Same report types as students, plus aggregated analytics

**Report Schemas** (exact replication from legacy):
- **CompanyRepPerformanceReport**: name, sales, daysWorked, totalCalls, battingAvg, workload, salary, commission, sales_contest, expenses, contributionMargin, behavior, marketShare
- **Finances**: total_rep_salaries, total_commissions, total_benefits, total_contest_budget, total_travel, manager_commission, manager_benefits, training_expenses, termination_expenses, clerical_expenses, rent_and_utilities, legal_and_other_expenses, market_research_expense, total_sales, gross_margin, total_expenses, net_income
- **HiringOutcomesReport**: oldRepOutcomes (poached/retained), newRepOutcomes (hired)
- **Market Reports**: compensation_report ($10K), salesrep_report ($10K), territory_report (performance penalty)

**Data Structure**:
- Industries contain parallel, non-interacting company groups
- Compilation processes industries independently but simultaneously
- Teacher dashboard shows industry grouping in report navigation

---

## Section 5: Resume Ranking (Simplified)

**Scope**: Students individually rank account manager profiles. Rankings combine into company hiring list.

**Two-Phase Flow**:
1. **Rough Sorting**: Students view unranked profiles one-by-one. Click A/B/C button to assign to group. Progress bar shows position.
2. **Refinement**: Students see **three groups (A/B/C) visible simultaneously**. Drag profiles within and between groups. Rankings persist until student changes them.

**Collaboration**:
- Each student has their own rankings (private)
- Real-time view of teammates' rankings
- Combined hiring list generated from all student rankings (voting algorithm)
- Hiring list used in hiring decisions

---

## Section 6: Compilation Logic (Stubbed for MVP)

**Scope**: Teacher triggers compilation. Backend generates results. For MVP, use randomized dummy data with semantic constraints.

**Hiring Compilation** (stub):
- Validate all companies submitted (or teacher chooses to proceed with defaults)
- Process firings (must be actual employees)
- Calculate attractiveness index
- Run hiring draft (companies hire from combined lists in attractiveness order)
- **Generate dummy hiring outcomes** with semantic constraints:
  - Can't hire someone already on your team
  - Can't hire someone already hired by higher-attractiveness company
  - Respect poaching rules (no poaching in Q1, no poaching if rep was just poached, minimum team size protection)
- Generate outcomes report

**Leadership Compilation** (stub):
- Check all companies submitted
- **Generate dummy performance data** for each rep
- **Generate dummy sales** per territory
- **Generate dummy financial reports**
- Generate outcomes report

**Cloud Functions**:
- `compileHiringDecisions(gameId, quarter)` - validates and compiles
- `compileLeadershipDecisions(gameId, quarter)` - validates and compiles
- Both functions write results to appropriate collections

**Constants** (from legacy, must be preserved):
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

---

## Section 7: Decision Schemas (Exact Replication from Legacy)

### Hiring Decisions (SalesDecisions)

**Compensation:**
- `salary` (integer, annual, USD) - Non-negative, defaults to $20,000 for first decision
- `commission` (integer, percentage 0-100) - Non-negative, defaults to 5%
- `sales_contest` (select: 0=none, 1=steak knives $50, 2=$1,000 cash, 3=Hawaii trip $3,000)
- `sales_contest_threshold` (integer) - Number of winners (closed-ended) or sales threshold (open-ended)
- `sales_contest_is_open` (boolean) - true=open-ended, false=closed-ended
- `benefits` (select: 1=bronze 5%, 2=silver 12%+$400, 3=gold 17%+$600)
- `travel` (select: 1=reps pay own, 2=monthly per diem, 3=unlimited 3% of sales)
- `per_diem` (integer, monthly, USD) - Required when travel=2, minimum $200

**Training** (all must sum to 100%):
- `training_product_knowledge` (percentage) - Minimum 25%
- `training_market_orientation` (percentage)
- `training_company_orientation` (percentage)
- `training_selling_techniques` (percentage) - Minimum 30%

**Hiring & Firing:**
- `num_to_hire` (radio: 0, 1, 2, or 3)
- `hiring_list` (array of rep IDs) - Combined company rankings, read-only
- `firing` (array of rep IDs) - Cannot fire below MIN_REPS=3

### Leadership Decisions (OtherDecisions)

**Territory Assignment:**
- County assignments per rep (JSON map)
- **Constraints**: All counties assigned, every rep gets ≥1 county, counties must be contiguous
- Randomize button available

**Sales Manager Time Allocation** (all must sum to 100%):
- `time_recruiting` (percentage) - Minimum 5%
- `time_meeting_customers` (percentage) - Minimum 5%
- `time_sales_planning` (percentage) - Minimum 5%
- `time_administrative_paperwork` (percentage) - Implicit remainder

**Individual Hours Distribution:**
- Base: Manager works 50 hours/week × 13 weeks = 650 hours/quarter
- One field per rep: `individual_hours_rep<id>` (non-negative hours)
- Must sum to: `(time_administrative_paperwork / 100) * 650`

**Leadership Behaviors:**
- Table format: One row per rep, radio select with 5 options
- Options: Praise, Punishment, Rules, Goals, Support
- Uses rep's `correct_leadership_behavior` and `incorrect_leadership_behavior` for performance

**Market Reports** (checkboxes):
- `compensation_report` (boolean) - $10,000 cost
- `salesrep_report` (boolean) - $10,000 cost, -1 performance modifier
- `territory_report` (boolean) - -1 performance modifier

---

## Next Steps

1. ✅ Requirements refined and documented
2. ⏳ Design supporting architecture (components, services, patterns)
3. ⏳ Write OpenSpec change documents
4. ⏳ Organize task list by dependency
5. ⏳ Launch into subagent-driven parallelized execution
