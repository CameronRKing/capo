# Proposal: Compilation Logic (Stubbed for MVP)

## Why

Teachers need to trigger compilation to generate business simulation results. For MVP, use randomized dummy data with semantic constraints rather than full business logic. This validates the entire workflow while deferring complex simulation algorithms.

## What Changes

- **Teacher Compilation Triggers**:
  - `compileHiringDecisions(gameId, quarter)`: Validates and compiles hiring decisions
  - `compileLeadershipDecisions(gameId, quarter)`: Validates and compiles leadership decisions
  - Both functions check all companies submitted (or teacher chooses to proceed with defaults)
- **Hiring Compilation (stub)**:
  - Validate all companies submitted (or use defaults if missing)
  - Process firings (must be actual employees, enforce MIN_REPS=3 constraint)
  - Calculate attractiveness index (compensation + benefits + travel + contest + recruiting bonus)
  - Run hiring draft (companies hire from combined lists in attractiveness order)
  - Generate dummy hiring outcomes with semantic constraints:
    - Can't hire someone already on your team
    - Can't hire someone already hired by higher-attractiveness company
    - Respect poaching rules (no poaching in Q1, no poaching if rep was just poached, minimum team size protection)
  - Generate outcomes report (oldRepOutcomes, newRepOutcomes)
- **Leadership Compilation (stub)**:
  - Check all companies submitted (or use defaults)
  - Generate dummy performance data for each rep (1-10 scale with reasonable distribution)
  - Generate dummy sales per territory (based on territory potential + rep performance + random variance)
  - Generate dummy financial reports (salaries, commissions, expenses, net income with semantic realism)
  - Generate outcomes report (rep performance, finances)
- **Cloud Functions**:
  - Implemented as Convex actions (can perform complex logic and multiple writes)
  - Write results to appropriate collections (ActiveRep, Finances, HiringOutcomes, etc.)
  - Triggered by teacher via admin dashboard
- **Constants Preservation** (from legacy, must be preserved):
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

## Capabilities

### New Capabilities

- `hiring-compilation`: Validate submitted decisions, calculate attractiveness indices, process firings with MIN_REPS constraint, run hiring draft with poaching rules, generate hiring outcomes report, stub dummy data generation

- `leadership-compilation`: Validate submitted decisions, generate dummy rep performance data, generate dummy territory sales, generate dummy financial reports, generate outcomes report, stub dummy data generation

- `attractiveness-calculation`: Calculate quarterly attractiveness from salary/4 + commission + benefits + travel + contest_value + recruiting_bonus, use previous quarter's recruiting percentage, apply contest multiplier (7x weight)

- `poaching-rules-engine`: Enforce no-poaching in Q1, prevent poaching of recently-poached reps (last quarter), protect minimum team size (MIN_REPS=3), enforce attractiveness-based hiring order

- `compilation-triggers`: Teacher-accessible Convex actions for triggering compilation, validation of submission status, default application for missing decisions, industry-parallel processing

### Modified Capabilities

None (all new capabilities for this feature area)

## Impact

**Affected Systems:**
- **Convex actions**: Add compilation actions with complex logic
- **Database writes**: Create/update ActiveRep, Finances, HiringOutcomes, CompanyRepPerformanceReport documents
- **Admin dashboard**: Add compilation trigger buttons with validation feedback
- **Constants module**: Centralize business constants from legacy

**New Dependencies:**
- None (uses existing Convex infrastructure)

**Data Models Affected:**
- ActiveRep: Created for new quarter with assigned company_id
- Finances: Created per company per quarter
- HiringOutcomesReport: Created per company per hiring phase
- CompanyRepPerformanceReport: Created per company per leadership phase
- Territory: Updated with new quarter assignments

**Breaking Changes:**
- None (new feature addition)

**Stub Implementation Notes:**
- Dummy data must pass semantic validation (no negative sales, reasonable performance ranges)
- Financial reports must balance (gross_margin = sales * 0.35, net_income = gross_margin - expenses)
- Hiring outcomes must respect company sizes (3-8 reps per company)
- Poaching rules enforced even with dummy data
- Attractiveness index calculated correctly (used for hiring order)
- Randomized data seeded by game_id + quarter for reproducibility

**Future Work:**
- Replace stub with actual business logic from legacy codebase
- Add notice system for business rule violations (e.g., "All male team", "No minorities")
- Add quiz generation from compilation results
