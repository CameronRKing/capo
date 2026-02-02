# Report Schemas - Complete Reference

**Source:** Legacy codebase at https://github.com/CameronRKing/cantopia-back
**Last Updated:** 2026-02-01
**Purpose:** Exact replication of all report schemas for data compatibility

---

## Executive Summary

**TOTAL REPORTS:** 12 distinct report types
**STATUS:** All reports documented with complete field schemas
**CONFIDENCE:** HIGH - Direct source code analysis

---

## Report Catalog

### 1. HiringOutcomesReport

**File:** `/tmp/cantopia-back/app/Reports/HiringOutcomesReport.php`
**Purpose:** Tracks hiring outcomes for reps (old and new)
**Used By:** Student hiring reports, HiringQuiz

#### Schema

```typescript
interface HiringOutcomesReport {
  oldRepOutcomes: Array<{
    id: number;           // rep_id from Salesrep table
    outcome: 'steady' | 'poached' | 'fired';
  }>;
  newRepOutcomes: Array<{
    id: number;           // rep_id from Salesrep table
    outcome: 'steady' | 'hired';
  }>;
}
```

#### Outcome Definitions
- **steady:** Rep was with company last quarter and remains this quarter
- **poached:** Rep was with company last quarter, not fired, but now with different company
- **fired:** Rep was explicitly fired via Firing table
- **hired:** Rep is new to the company this quarter

#### Logic Summary
- Compares `ActiveRep.previous(date_key)` vs `ActiveRep.current(date_key)`
- Cross-references with `Firing` and `Hiring` tables
- Used to generate quiz questions about hiring outcomes

---

### 2. CompanyRepPerformanceReport

**File:** `/tmp/cantopia-back/app/Reports/CompanyRepPerformanceReport.php`
**Purpose:** Detailed performance metrics for each rep in a company
**Used By:** TerritoryQuiz, FinancialDetailedReport
**Access Control:** Students see only their company; teachers see all companies in their simulation

#### Schema

```typescript
interface CompanyRepPerformanceReport {
  reps: Array<{
    // Identity
    name: string;

    // Sales Metrics
    sales: number;                // total_sales from ActiveRep
    marketShare: number;          // percentage (0-100)

    // Activity Metrics
    daysWorked: number;           // calculated: 48 + (performance * 2) + random(-1 to 1)
    totalCalls: number;           // calls_made + random(-10 to 10)
    battingAvg: number;           // 36 + 4.4 * performance + random(-0.22 to 0.22)
    workload: number;             // percentage of assigned calls vs calls_per_qtr

    // Compensation (Quarterly)
    salary: number;               // from previous SalesDecision / 4
    commission: number;           // (commission_rate / 100) * total_sales
    sales_contest: number;        // contest_budget from SalesDecision
    expenses: number;             // contests + benefits + travel

    // Profitability
    contributionMargin: number;   // sales * (1 - COST_OF_GOODS) - salary - commission - expenses

    // Leadership
    behavior: number;             // 1 (correct), -1 (incorrect), 0 (neutral)
  }>;
}
```

#### Calculation Formulas

**Days Worked:**
```
48 + (performance * 2) + random(-DAYS_WIGGLE to DAYS_WIGGLE)
// DAYS_WIGGLE = 1
```

**Total Calls:**
```
calls_made + random(-CALLS_WIGGLE to CALLS_WIGGLE)
// CALLS_WIGGLE = 10
// Capped at calls_per_qtr
```

**Batting Average:**
```
36 + 4.4 * performance + random(-ORDERS_WIGGLE to ORDERS_WIGGLE)
// ORDERS_WIGGLE = 2.2
// Returns 0 if total_sales == 0
```

**Commission:**
```
(salesDecision.commission / 100) * rep.total_sales
```

**Benefits:**
```
Utils::calcBenefitsExpenses(salesDecision.benefits, salary, commission)
```

**Travel:**
```
Utils::calcTravelExpenses(salesDecision.travel, salesDecision.per_diem, rep.total_sales)
```

**Contribution Margin:**
```
sales * (1 - Constants.COST_OF_GOODS) - salary - commission - expenses
// COST_OF_GOODS = 0.65
```

**Market Share:**
```
(rep.total_sales / total_territory_sales) * 100
// total_territory_sales = sum of all rep sales in rep's assigned territories
```

**Workload:**
```
(sum of territory.calls / rep.calls_per_qtr) * 100
```

---

### 3. Finances (Model)

**File:** `/tmp/cantopia-back/app/Models/Finances.php`
**Purpose:** Complete financial breakdown for a company per quarter
**Used By:** FinancialDetailedReport, FinancialOverviewReport
**Access Control:** Students see only their company; teachers see all companies

#### Schema

```typescript
interface Finances {
  // Identifiers
  company_id: number;
  date_key: string;              // Format: Y#Q#C# (e.g., Y1Q2C2)

  // Revenue
  total_sales: number;           // Sum of all territory sales for company

  // Direct Expenses
  total_rep_salaries: number;    // ceil(salary * numReps / 4)
  total_commissions: number;     // ceil((commission / 100) * total_sales)
  total_benefits: number;        // calcBenefitsExpenses(salary/4, commissions, numReps)
  total_contest_budget: number;  // ceil(salesContestCost() * numContestWinners())
  total_travel: number;          // calcTravelExpenses(travel, per_diem, total_sales, numReps)

  // Overhead Expenses
  manager_commission: number;    // ceil(total_sales * MANAGER_COMMISSION)
  manager_benefits: number;      // ceil((manager_commission + MANAGER_SALARY_QTR) * 0.2)
  // manager_salary is not in DB (added by cleanForReport): MANAGER_SALARY_QTR
  // manager_travel is not in DB (added by cleanForReport): MANAGER_TRAVEL_QTR
  training_expenses: number;     // TRAINING_EXPENSES * numNewHires
  termination_expenses: number;  // TERMINATION_EXPENSES * numFires
  clerical_expenses: number;     // CLERICAL_EXPENSES
  rent_and_utilities: number;    // ceil((90-110% of RENT_AND_UTILITIES) + random(-100 to 100))
  legal_and_other_expenses: number;  // LEGAL_AND_OTHER + sum(notice costs)
  market_research_expense: number;   // COMPENSATION_REPORT_COST if purchased + SALESREP_REPORT_COST if purchased

  // Calculated Fields
  gross_margin: number;          // total_sales * (1 - COST_OF_GOODS)
  total_expenses: number;        // direct_expenses + overhead_expenses
  net_income: number;            // gross_margin - total_expenses

  // Methods
  getDirectExpenses(): number;   // sum of all direct expenses
  getOverheadExpenses(): number; // sum of all overhead expenses
  getRank(): number;             // company ranking by earnings_to_date (1-4)
  cleanForReport(): object;      // removes id, timestamps; adds manager_salary, manager_travel
}
```

#### Constants

```typescript
const Constants = {
  COST_OF_GOODS: 0.65,
  MANAGER_COMMISSION: 0.02,
  MANAGER_SALARY_QTR: 20000,
  MANAGER_TRAVEL_QTR: 750,
  TRAINING_EXPENSES: 6000,
  TERMINATION_EXPENSES: 15000,
  CLERICAL_EXPENSES: 10000,
  RENT_AND_UTILITIES: 7500,
  LEGAL_AND_OTHER: 10000,
  SALESREP_REPORT_COST: 10000,
  COMPENSATION_REPORT_COST: 10000,
}
```

---

### 4. FinancialDetailedReport

**File:** `/tmp/cantopia-back/app/Reports/FinancialDetailedReport.php`
**Purpose:** Complete financial report for a single company, single quarter
**Used By:** Admin report drilling, student financial reports
**Access Control:** Students see only their company; teachers see all

#### Schema

```typescript
interface FinancialDetailedReport {
  industry_id: string;           // Industry name
  date_key: string;              // Pretty-printed date key
  company_id: number;

  // Core finances (from Finances.cleanForReport())
  finances: {
    // All Finances fields except id, created_at, updated_at
    // Plus manager_salary and manager_travel added
    [key: string]: number | string;
  };

  // Industry comparison
  overviewReport: FinancialOverviewReport | null;

  // Company's rep performance
  repReport: CompanyRepPerformanceReport | null;

  // Market research reports (if purchased)
  marketReports: {
    acctMgr: AcctMgrMarketReport;
    territories: TerritoriesMarketReport;
    compensation: CompensationMarketReport;
  } | null;
}
```

**Note:** Returns null for all sub-reports if finances don't exist yet (not compiled)

---

### 5. FinancialOverviewReport

**File:** `/tmp/cantopia-back/app/Reports/FinancialOverviewReport.php`
**Purpose:** Industry-wide financial comparison for all companies
**Used By:** Admin dashboard, instructor reports
**Access Control:** Teachers and admins only

#### Schema

```typescript
interface FinancialOverviewReport {
  simulation_id: number;
  industry_id: number;
  industry: string;              // Industry name
  date_key: string;              // Current C2 date key
  date_keys: string[];           // All previous C2 date keys
  hasLinks: boolean;             // Whether to include clickable links
  notices: string[];             // All industry notice messages

  // Per-company financial data
  finances: Array<{
    date_key: string;
    company_id: number;
    company_name: string;
    num_reps: number;
    total_sales: number;
    direct_expenses: number;     // From Finances.getDirectExpenses()
    overhead_expenses: number;   // From Finances.getOverheadExpenses()
    net_income: number;
    sales_to_date: number;       // Cumulative total sales
    earnings_to_date: number;    // Cumulative net income
    current_position: number;    // 1-4 ranking by earnings_to_date
    simulation_id: number;
    industry_id: number;
  }>;

  // Historical data for charts
  companies: Array<{
    sales: number[];             // Array of quarterly net incomes
    name: string;                // Company name
  }>;
}
```

**Ranking Logic:**
- Sorted by `earnings_to_date` descending
- Positions 1-4 assigned
- Ties resolved by order in collection

---

### 6. SalesBreakdownReport

**File:** `/tmp/cantopia-back/app/Reports/SalesBreakdownReport.php`
**Purpose:** County-by-county, rep-by-rep sales breakdown (admin only)
**Used By:** Admin report page
**Access Control:** Admins only

#### Schema

```typescript
interface SalesBreakdownReport {
  counties: Array<{
    // County identity
    name: string;                // County name

    // Reps assigned to this county
    rep1_name: string;
    rep2_name: string;
    rep3_name: string;
    rep4_name: string;

    // Sales per rep
    rep1_sales: number;
    rep2_sales: number;
    rep3_sales: number;
    rep4_sales: number;

    // Rep performance index
    rep1_quality: number;        // From ActiveRep.performance
    rep2_quality: number;
    rep3_quality: number;
    rep4_quality: number;

    // Territory size
    rep1_dispensaries: number;   // Sum of dispensaries across rep's territories
    rep2_dispensaries: number;
    rep3_dispensaries: number;
    rep4_dispensaries: number;
  }>;
  industry_id: string;           // Industry name
  date_key: string;
}
```

**Caching:** Uses static variables to cache performance and dispensary calculations

---

### 7. AcctMgrMarketReport (Account Manager Market Report)

**File:** `/tmp/cantopia-back/app/Reports/AcctMgrMarketReport.php`
**Purpose:** Shows all account managers and their total sales (market research)
**Used By:** MarketReports (purchased by OtherDecision.salesrep_report)
**Access Control:** Purchasing company only

#### Schema

```typescript
interface AcctMgrMarketReport {
  reps: Array<{
    company_id: number;
    rep_id: number;
    total_sales: number;         // From ActiveRep.total_sales
  }>;
}
```

**Note:** Only shows hired reps (company_id not null), sorted by company_id

---

### 8. CompensationMarketReport

**File:** `/tmp/cantopia-back/app/Reports/CompensationMarketReport.php`
**Purpose:** Shows all companies' compensation packages (market research)
**Used By:** MarketReports (purchased by OtherDecision.compensation_report)
**Access Control:** Purchasing company only

#### Schema

```typescript
interface CompensationMarketReport {
  decisions: Array<{
    salary: number;
    commission: number;
    travel: number;              // 0-3 (travel option)
    per_diem: number;
    benefits: number;            // 0-2 (benefits option)
    company_id: number;
  }>;
}
```

**Data Source:** SalesDecision from PREVIOUS quarter (why compensation decisions lag)

---

### 9. TerritoriesMarketReport

**File:** `/tmp/cantopia-back/app/Reports/TerritoriesMarketReport.php`
**Purpose:** Territory assignment maps with market dominance
**Used By:** MarketReports (purchased by OtherDecision.territory_report)
**Access Control:** Purchasing company only

#### Schema

```typescript
interface TerritoriesMarketReport {
  // Per-company territory maps
  companyMaps: Array<{
    counties: {
      [county_id: number]: number;  // Color code: rep_id % 70 (or 70 if 0)
    };
    labels: number[];             // Array of salesrep IDs for this company
    heading: string;              // Company name
    hasLegend: boolean;           // Whether to show legend (true for students)
  }>;

  // Market dominance map
  marketShare: {
    counties: {
      [county_id: number]: number;  // company_id with highest sales in county
    };
    labels: number[];             // Array of company IDs
    heading: string;              // "Market Dominance Report"
  };
}
```

**Color Coding Logic:**
```
rep_id % 70 || 70
// Converts ActiveRep.id to SalesRep.id space
// SalesReps are 1-70, ActiveReps are much larger numbers
```

**Market Dominance:**
```
company_id of rep with highest sales in each territory
// Uses Territory.best_rep_pos (pre-calculated for performance)
```

---

### 10. MarketReports (Container Report)

**File:** `/tmp/cantopia-back/app/Reports/MarketReports.php`
**Purpose:** Container for market research reports (conditional on purchase)
**Used By:** FinancialDetailedReport, student reports
**Access Control:** Students only get reports they purchased; teachers get all

#### Schema

```typescript
interface MarketReports {
  industry: string;
  quarter: string;               // Year/Quarter (e.g., "Y1Q2")

  reports: {
    acctMgr: AcctMgrMarketReport | [];      // Empty if not purchased
    territories: TerritoriesMarketReport | [];  // Empty if not purchased
    compensation: CompensationMarketReport | [];  // Empty if not purchased
  };
}
```

**Conditional Logic:**
- Teachers get all reports
- Students only get reports they purchased (via OtherDecision flags)
- Empty collections returned for unpurchased reports

**Purchase Flags (OtherDecision):**
```typescript
{
  salesrep_report: boolean;      // Purchases AcctMgrMarketReport
  territory_report: boolean;     // Purchases TerritoriesMarketReport
  compensation_report: boolean;  // Purchases CompensationMarketReport
}
```

---

### 11. CompanyDecisionReport

**File:** `/tmp/cantopia-back/app/Reports/CompanyDecisionReport.php`
**Purpose:** Shows a single company's decision data (sales or other)
**Used By:** Student decision history, reports
**Access Control:** Students see only their company's decisions

#### Schema (Sales Decision)

```typescript
interface CompanyDecisionReport {
  industry_id: string;
  date_key: string;
  company_id: number;

  decision: {
    // From SalesDecision (excluding id, company_id, timestamps)
    // Compensation
    salary: number;
    commission: number;
    contest_budget: number;
    benefits: number;            // 0-2
    travel: number;              // 0-3
    per_diem: number;
    sales_contest: number;       // 0-3 (contest type)
    sales_contest_is_open: boolean;
    sales_contest_threshold: number;

    // Training
    product_knowledge: number;
    market_orientation: number;
    company_orientation: number;
    selling_techniques: number;

    // Hiring
    num_to_hire: number;

    // Computed/Related
    industry: string;            // Industry name
    attrIndex: number;           // Attractiveness index (teachers only)
    hired: number[];             // Array of Salesrep IDs (from RepRankingCombiner)
    fired: number[];             // Array of rep_id from Firing table
    hiringOutcomes: HiringOutcomesReport;
  } | null;
}
```

#### Schema (Other Decision)

```typescript
interface CompanyDecisionReport {
  industry_id: string;
  date_key: string;
  company_id: number;

  decision: {
    // From OtherDecision (excluding id, company_id, timestamps)
    recruiting: number;
    meeting_customers: number;
    sales_planning: number;
    individual_hours: number;
    salesrep_report: boolean;
    territory_report: boolean;
    compensation_report: boolean;

    // Related data
    industry: string;

    // Behavior reference
    behaviors: {
      [behavior_id: number]: {
        id: number;
        name: string;
        description: string;
        affects: string;         // What this behavior affects
      };
    };

    // Rep leadership data
    reps: Array<{
      rep_id: number;
      leadership_behavior: number;  // Behavior ID
      individual_hours: number;     // 0, 1, 2+
    }>;

    // Territory assignments
    territories: {
      [county_id: number]: number;   // salesrep_id assigned
    };
  } | null;
}
```

---

### 12. IndustryDecisionReport

**File:** `/tmp/cantopia-back/app/Reports/IndustryDecisionReport.php`
**Purpose:** Shows all companies' decisions for comparison (industry-wide)
**Used By:** Admin reports, instructor dashboard
**Access Control:** Teachers and admins only

#### Schema

```typescript
interface IndustryDecisionReport {
  industry: string;
  date_key: string;

  report: CompanyDecisionReport['decision'][];  // Array of company decisions
}
```

**Note:** Contains same decision data as CompanyDecisionReport but for ALL companies in industry, sorted by position

---

## Additional Quiz Data Structures

### HiringQuiz
**File:** `/tmp/cantopia-back/app/HiringQuiz.php`

**Questions Generated:**
1. Salary offered
2. Commission rate
3. Number hired
4. Number poached
5. Size of new sales team
6. Training percentages (4 questions)

**Source Data:** SalesDecision, HiringOutcomesReport

### TerritoryQuiz
**File:** `/tmp/cantopia-back/app/TerritoryQuiz.php`

**Questions Generated:**
1. Which company generated most income this quarter
2. Current position ranking
3. Count of reps with correct leadership behavior
4. Total sales contest expense
5. Acct mgr with greatest contribution margin
6. Acct mgr with greatest workload

**Source Data:** Finances (industry), CompanyRepPerformanceReport

---

## Database Models Supporting Reports

### ActiveRep
**Key Fields for Reports:**
- `rep_id`: Links to Salesrep
- `total_sales`: Calculated during compilation
- `calls_made`: Total territory calls
- `performance`: Calculated performance index (1-10)
- `company_id`: Current employer
- `date_key`: Quarter identifier
- `individual_hours`: Leadership decision
- `leadership_behavior`: Behavior choice

### Territory
**Key Fields for Reports:**
- `county_id`: Geographic area
- `rep1_id` through `rep4_id`: Assigned reps
- `rep1_sales` through `rep4_sales`: Sales per rep
- `market_potential`: From county
- `calls`: From county
- `dispensaries`: From county

### SalesDecision
**Key Fields for Reports:**
- Compensation: salary, commission, benefits, travel, per_diem, contest_budget
- Training: product_knowledge, market_orientation, company_orientation, selling_techniques
- Sales contest: sales_contest, sales_contest_is_open, sales_contest_threshold
- Hiring: num_to_hire
- Computed: attrIndex

### OtherDecision
**Key Fields for Reports:**
- Supervision: recruiting, meeting_customers, sales_planning, individual_hours
- Market reports: salesrep_report, territory_report, compensation_report

### Finances
See complete schema in Report #3 above.

---

## Report Generation Triggers

1. **After Sales Compilation (C1):**
   - HiringOutcomesReport
   - IndustryDecisionReport (hiring)
   - CompanyDecisionReport (hiring)
   - HiringQuiz

2. **After Other Compilation (C2):**
   - CompanyRepPerformanceReport
   - Finances
   - FinancialOverviewReport
   - FinancialDetailedReport
   - SalesBreakdownReport
   - MarketReports (if purchased)
   - TerritoryQuiz
   - IndustryDecisionReport (territory)
   - CompanyDecisionReport (territory)

---

## Routes Serving Reports

### Admin Routes
```
GET /reports/admin/{simulation_id}/{industry_id}/{date_key}
  -> SalesBreakdownReport (admin view)

GET /reports/finances/company/{company_id}/{date_key}
  -> FinancialDetailedReport (admin view)

GET /reports/{sim}/{industry_name}/{quarter}
  -> getIndustryReportsForQuarter()
  Returns: { hiringReport, territoryReport, finances, marketReports }

GET /reports/winners/{sim}
  -> getWinnersForSimulation()
  Returns: [{ industry, company, earnings }]
```

### Student Routes
```
GET /student/reports
  -> getStudentReports()
  Returns: { finances: FinancialDetailedReport[], decisions: CompanyDecisionReport[] }

GET /student/quizzes
  -> getQuizzes()
  Returns: StudentQuiz data with questions and answers
```

---

## Summary by Data Type

### Financial Reports (5)
- Finances (model)
- FinancialDetailedReport
- FinancialOverviewReport
- CompanyRepPerformanceReport (includes financial metrics)
- MarketReports (cost of reports appears in Finances)

### Decision Reports (3)
- CompanyDecisionReport
- IndustryDecisionReport
- GathersDecisionData (trait, not standalone)

### Market Research Reports (3)
- AcctMgrMarketReport
- CompensationMarketReport
- TerritoriesMarketReport

### Operational Reports (3)
- HiringOutcomesReport
- SalesBreakdownReport
- MarketReports (container)

---

## Confidence Assessment

**HIGH CONFIDENCE** - All reports found:
- ✅ Searched entire Reports directory
- ✅ Analyzed ReportsController for all report endpoints
- ✅ Cross-referenced with view files
- ✅ Traced report generation in compilers
- ✅ Verified all report classes are used in routes

**Sources:**
- `/tmp/cantopia-back/app/Reports/*.php` - 12 report files
- `/tmp/cantopia-back/app/Models/Finances.php` - Finances model
- `/tmp/cantopia-back/app/Http/Controllers/ReportsController.php` - Report endpoints
- `/tmp/cantopia-back/app/Http/routes.php` - Route definitions

---

**END OF REPORT SCHEMAS**
