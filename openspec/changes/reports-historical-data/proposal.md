# Proposal: Reports & Historical Data

## Why

Students need to review past decisions and outcomes to understand performance trends. Teachers require cross-company rollups for comparison and assessment. Reports must respect role-based access control (students see only their company; teachers see all companies in their simulation).

## What Changes

- **Student Reports**:
  - View only their own company's decisions and outcomes
  - Convex query filters enforce access policy (server-side filtering prevents unauthorized data access)
  - Available reports: hiring outcomes, financial reports, rep performance
  - Navigate by quarter/decision type with filtering UI
- **Teacher Reports**:
  - View all companies within their assigned simulation
  - Organized by industry (orthogonal groups - companies in Industry A don't compete with Industry B)
  - Cross-industry comparison views
  - Rollup reports across all companies in simulation
  - Same report types as students, plus aggregated analytics
- **Report Schemas** (exact replication from legacy):
  - **CompanyRepPerformanceReport**: name, sales, daysWorked, totalCalls, battingAvg, workload, salary, commission, sales_contest, expenses, contributionMargin, behavior, marketShare
  - **Finances**: total_rep_salaries, total_commissions, total_benefits, total_contest_budget, total_travel, manager_commission, manager_benefits, training_expenses, termination_expenses, clerical_expenses, rent_and_utilities, legal_and_other_expenses, market_research_expense, total_sales, gross_margin, total_expenses, net_income
  - **HiringOutcomesReport**: oldRepOutcomes (poached/retained), newRepOutcomes (hired)
  - **Market Reports**: compensation_report ($10K), salesrep_report ($10K), territory_report (performance penalty)
- **Data Structure**:
  - Industries contain parallel, non-interacting company groups
  - Compilation processes industries independently but simultaneously
  - Teacher dashboard shows industry grouping in report navigation
- **Access Control Enforcement**:
  - Student queries filter by company_id at database level
  - Teacher queries filter by simulation_id at database level
  - No client-side filtering (security enforced server-side)

## Capabilities

### New Capabilities

- `student-reports`: Company-scoped report queries with enforced access control, quarter-based navigation, hiring outcomes with rep status changes, financial reports per quarter, rep performance breakdown

- `teacher-reports`: Simulation-scoped report queries with multi-company access, industry-grouped navigation, cross-company comparison analytics, rollup views (aggregated financials, ranking positions), market research reports (if purchased)

- `report-generation`: Post-compilation report creation from decision and outcome data, report caching for performance, historical report storage

- `industry-organization`: Industry data structure with parallel company groups, independent compilation per industry, industry-aware navigation UI

### Modified Capabilities

- `rbac-security`: Extend RLS framework to support simulation-level and company-level query filtering

## Impact

**Affected Systems:**
- **Convex queries**: Add filtered queries for reports (student vs teacher access patterns)
- **Database schema**: Add report collections (finances, hiring_outcomes, rep_performance, market_reports)
- **React components**: Create report viewing components with navigation and filtering
- **API security**: All report endpoints enforce access control at query level

**New Dependencies:**
- None (uses existing Convex infrastructure)

**Data Models:**
- Finances documents (one per company per quarter)
- HiringOutcomesReport documents (one per company per hiring phase)
- CompanyRepPerformanceReport documents (generated per leadership compilation)
- MarketReports documents (conditional on purchase)

**Breaking Changes:**
- None (new feature addition)

**Performance Considerations:**
- Reports generated once per compilation and cached
- Historical report queries paginated
- Report access controlled via Convex RLS (no client-side filtering bypass possible)
