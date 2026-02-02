# Decision Schemas - Complete Reference

**Source:** Legacy codebase at https://github.com/CameronRKing/cantopia-back
**Last Updated:** 2026-02-01
**Purpose:** Exact replication of all decision input schemas for data compatibility

---

## Data Sources & Access Control

**Asset Files:**
- **Resumes:** `/data/projects/newtopia/src/assets/data/resumes.ts` (70 reps) - **PUBLIC** (everyone can read)
- **Rep Performance:** `/data/projects/newtopia/src/assets/data/repPerf.ts` - **RESTRICTED** (students CANNOT see this)
- **Counties:** `/data/projects/newtopia/src/assets/data/counties.ts` (88 Ohio counties)
- **County Networks:** `/data/projects/newtopia/src/assets/data/countyNetworks.ts` (adjacency for contiguity validation)

**Important:** Rep performance data contains `effort`, `sales`, `correct_leadership_behavior`, and `incorrect_leadership_behavior` that must be hidden from students. These fields affect compilation but should NOT be visible during ranking or decision-making.

**Rep Data Structure:**
- `resumes.ts` - Public info: name, gender, education, experience, intelligence, myers_briggs, other_info, interview, reference_check
- `repPerf.ts` - Private info: effort, sales, calls_per_qtr, correct/incorrect leadership behaviors, individual hours modifiers

---

## Overview

Cantopia has two decision phases per quarter:
1. **Hiring Decisions (SalesDecisions)** - Compensation, training, hiring, firing
2. **Leadership Decisions (OtherDecisions)** - Territory assignment, time allocation, leadership behaviors, market reports

---

# 1. HIRING DECISIONS (SalesDecisions)

## 1.1 Compensation Fields

### Salary
- **Field Name:** `salary`
- **Type:** Integer (annual salary in dollars)
- **Validation:**
  - Cannot be zero (penalty: -2 performance modifier for all reps)
  - Compared to industry average for performance calculations
- **Used In:**
  - Attractiveness index calculation (quarterly: `salary / 4`)
  - Total rep salaries: `salary * numReps / 4`
  - Performance modifier: +1 if above industry average, 0 if at average

### Commission
- **Field Name:** `commission`
- **Type:** Integer (percentage, stored as 0-15, not 0.00-0.15)
- **Validation:**
  - Cannot be zero (penalty: -3 performance modifier)
  - Industry average comparison:
    - More than 2% below average: -2 modifier
    - 0-2% below average: -1 modifier
    - At average: 0 modifier
    - 0-2% above average: +1 modifier
    - 2-4% above average: +2 modifier
    - 4%+ above average: +3 modifier
- **Calculation:** `(commission / 100) * total_sales`
- **Used In:** Attractiveness index, quarterly commission calculations

### Benefits Package
- **Field Name:** `benefits`
- **Type:** Integer (select/radio: 1, 2, or 3)
- **Options:**
  - `1` - Basic: `(commissions + quarterlySalary * numReps) * 0.05`
  - `2` - Standard: `(commissions + quarterlySalary * numReps) * 0.12 + (numReps * 400)`
  - `3` - Premium: `(commissions + quarterlySalary * numReps) * 0.17 + (numReps * 600)`
- **Validation:** None explicitly stated
- **Used In:** Attractiveness index, quarterly benefits expenses

### Travel Package
- **Field Name:** `travel`
- **Type:** Integer (select/radio: 1, 2, or 3)
- **Options:**
  - `1` - Company-paid expenses: `sales * 0.03`
  - `2` - Per diem: `per_diem * 3 * numReps` (per_diem is monthly, multiply by 3 for quarterly)
  - `3` - Reps pay own expenses: `0`
- **Validation:**
  - If reps pay own (travel=3): -1 performance modifier
  - Low per diem notice triggers if travel=2 and per_diem < 200
  - "Own expenses" morale problem if travel=3
- **Used In:** Attractiveness index, quarterly travel expenses

### Per Diem
- **Field Name:** `per_diem`
- **Type:** Integer (monthly amount in dollars)
- **Validation:** Required when `travel=2`, otherwise ignored
- **Notice Triggers:** Low per diem notice if `travel=2 AND per_diem < 200`
- **Used In:** Travel expense calculation for package 2

### Sales Contest
- **Field Name:** `sales_contest`
- **Type:** Integer (select/radio: 0, 1, 2, or 3)
- **Options:**
  - `0` - No contest: Cost $0, Boost +0
  - `1` - Steak knives: Cost $50 per winner, Boost +1 (TRIGGERS NOTICE)
  - `2` - Cash prize: Cost $1000 per winner, Boost +1
  - `3` - Vacation: Cost $3000 per winner, Boost +2
- **Validation:**
  - Steak knives (option 1) triggers "SteakKnifeNotice" with $80,000 cost
- **Cost Calculation:**
  - `salesContestCost() * numContestWinners()`
  - `numContestWinners()` depends on contest type:
    - If open: reps with `sales > sales_contest_threshold`
    - If closed: `sales_contest_threshold / (currSizeOfStaff + num_to_hire)`
- **Performance Modifier:**
  - Lowest quality rep OR contest winner gets boost based on type
- **Used In:** Attractiveness index (multiplied by 7 for weight)

### Sales Contest Threshold
- **Field Name:** `sales_contest_threshold`
- **Type:** Integer (number of reps who can win)
- **Validation:** Required when `sales_contest > 0`
- **Default:** Implicitly calculated if not set
- **Used In:** Determining number of contest winners

### Sales Contest Is Open
- **Field Name:** `sales_contest_is_open`
- **Type:** Boolean
- **Validation:** N/A
- **Used In:** Determining how winners are calculated

---

## 1.2 Training Decisions

All training fields are **percentages that must sum to 100%**.

### Product Knowledge Training
- **Field Name:** `product_knowledge`
- **Type:** Integer (percentage: 0-100)
- **Validation:**
  - Part of 100% sum constraint
  - **Minimum 25% required** (otherwise triggers "InadequateProductTrainingNotice" with $20,000 cost)
- **Performance Modifier:**
  - +1 if ALL training ≥ 10% AND company_orientation < product AND company_orientation < market
  - -2 if ANY training = 0

### Market/Industry Orientation Training
- **Field Name:** `market_orientation`
- **Type:** Integer (percentage: 0-100)
- **Validation:** Part of 100% sum constraint
- **Performance Modifier:** (see Product Knowledge above)

### Company Orientation Training
- **Field Name:** `company_orientation`
- **Type:** Integer (percentage: 0-100)
- **Validation:** Part of 100% sum constraint
- **Performance Modifier:**
  - +1 if company_orientation is LOWEST and all ≥ 10%

### Selling Techniques Training
- **Field Name:** `selling_techniques`
- **Type:** Integer (percentage: 0-100)
- **Validation:**
  - Part of 100% sum constraint
  - **Minimum 30% required** (otherwise triggers "InadequateSellingTrainingNotice" with $30,000 cost)
- **Performance Modifier:** (see Product Knowledge above)

---

## 1.3 Hiring

### Number to Hire
- **Field Name:** `num_to_hire`
- **Type:** Integer (radio select: 0, 1, 2, or 3)
- **Maximum:** 3 (defined in `Constants::MAX_HIRE_COUNT`)
- **Default:** 0
- **Validation:** Must be 0-3
- **Used In:**
  - Attractiveness index calculation
  - Hiring compilation loop
  - Quiz generation

### Hiring List
- **Field Name:** `hiring`
- **Type:** Array/List of rep IDs (ordered ranking)
- **Source:** Combined ranking from all team members
- **Generation:** Modified Borda count algorithm
  - Each student's rankings added together
  - Ties broken alphabetically
  - Groups (A/B/C) are UI affordance only, not part of algorithm
- **Validation:**
  - Must be ordered list
  - Contains unique rep IDs
- **Used In:** Hiring compilation - offers made in order until num_to_hire reached

---

## 1.4 Firing

### Firing List
- **Field Name:** `firing`
- **Type:** Array/List of rep IDs (unordered set)
- **Validation:**
  - **Minimum team size constraint:** Cannot fire if would leave company with < 3 reps (`Constants::MIN_REPS`)
  - Maximum fires: Not explicitly stated in code
  - Cannot fire reps not currently employed by company
- **Used In:** First step of hiring compilation

---

# 2. LEADERSHIP DECISIONS (OtherDecisions)

## 2.1 Territory Assignment

### Interactive Map
- **Format:** SVG map of Ohio counties
- **Assignment Method:**
  - Click rep in legend to select
  - Click county to assign to selected rep
  - "Unassigned" option in legend removes county assignments

### Contiguity Constraint
- **Rule:** Counties must be geographically contiguous
- **Validation:**
  - Assignment rejected if new county not touching existing territory
  - Exception: First assignment (no existing territory)
- **Data:** Contiguity data in county core data

### Coverage Constraints
- **All counties must be assigned** (no unassigned counties allowed)
- **Every rep must have at least one county**
- **Default:** All counties unassigned initially

### County Data
- **Shops per county:** Fixed number in core data
- **Market potential:** Used in sales calculations
- **Calls per county:** Variable based on territory assignment

### Randomize Button
- **Purpose:** Help students get started with initial assignment
- **Behavior:** Auto-assigns counties respecting constraints

---

## 2.2 Sales Manager Time Allocation

All time allocation fields are **percentages that must sum to 100%**.

### Recruiting Time
- **Field Name:** `recruiting`
- **Type:** Integer (percentage: 0-100)
- **Default:** 0%
- **Validation:**
  - Part of 100% sum constraint
  - **Minimum 5% required** (otherwise -1 performance modifier for all reps)
- **Used In:**
  - Attractiveness index: `recruiting * Constants::RECRUITING_BONUS` (2000)
  - Performance calculation

### Meeting with Customers Time
- **Field Name:** `meeting_customers`
- **Type:** Integer (percentage: 0-100)
- **Default:** 0%
- **Validation:**
  - Part of 100% sum constraint
  - **Minimum 5% required** (otherwise -1 performance modifier)
- **Used In:** Performance calculation

### Sales Planning Time
- **Field Name:** `sales_planning`
- **Type:** Integer (percentage: 0-100)
- **Default:** 0%
- **Validation:**
  - Part of 100% sum constraint
  - **Minimum 5% required** (otherwise -1 performance modifier)
- **Used In:** Performance calculation

### Administrative Paperwork Time
- **Field Name:** `administrative_paperwork` (or implicit remainder)
- **Type:** Integer (percentage: 0-100)
- **Default:** 0%
- **Validation:**
  - Part of 100% sum constraint
  - **Minimum 5% required** (otherwise -1 performance modifier)
- **Note:** Supervision check applies to recruiting, meeting_customers, and sales_planning only

---

## 2.3 Individual Hours Distribution

### Base Calculation
- **Assumption:** Sales manager works 50 hours per week
- **Hours to Distribute:** `(individual_sessions_percentage / 100) * 50 * 13 weeks` = quarterly hours
- **Constraint:** All individual hour fields must sum to hours to distribute

### Individual Rep Hours Fields
- **Field Name:** `individual_hours` (per rep)
- **Type:** Integer (hours per quarter per rep)
- **One field per:** Account manager on the team
- **Default:** 0 hours
- **Validation:**
  - All fields must sum to calculated hours to distribute
  - Non-negative values only
- **Performance Modifiers:**
  - `individual_hours == 0`: -1 modifier
  - `individual_hours >= 1`: Use `ind_hrs_0_1` value from rep data
  - `individual_hours > 2`: Use `ind_hrs_2_plus` value from rep data
- **Data Source:** Rep's `ind_hrs_0_1` and `ind_hrs_2_plus` fields from coreRepData

---

## 2.4 Leadership Behaviors

### Structure
- **Format:** Table with one row per account manager
- **Columns:** Five behavioral options (radio select per row)
- **Selection:** Single behavior per rep (radio select)

### Behavioral Options
1. **Positive Verbal Feedback (Praise)**
2. **Negative Verbal Feedback (Punishment)**
3. **Clarifying Rules and Policies**
4. **Setting Future Goals for the Particular Rep**
5. **Providing Individualized Support**

### Leadership Behavior Field
- **Field Name:** `leadership_behavior` (per rep)
- **Type:** Integer (1-5, corresponding to above options)
- **Default:** 1 (first option)
- **Validation:** One behavior must be selected per rep

### Correct/Incorrect Behaviors
- **Data Source:** Each rep has `correct_leadership_behavior` and `incorrect_leadership_behavior` fields
- **Performance Modifiers:**
  - `leadership_behavior == correct_leadership_behavior`: +1 modifier
  - `leadership_behavior == incorrect_leadership_behavior`: -1 modifier
  - Otherwise: 0 modifier
- **Source Data:** From `coreRepData.csv` columns:
  - `correct_leadership_behavior` (values 1-5)
  - `incorrect_leadership_behavior` (values 1-5)

### Quiz Integration
- Quiz asks: "For how many account managers are you exhibiting the correct leader behavior?"
- Count reps where `leadership_behavior == correct_leadership_behavior`

---

## 2.5 Market Reports

### Competitive Salesperson Performance Report
- **Field Name:** `salesrep_report`
- **Type:** Boolean (checkbox: "1" for purchased, empty/0 for not)
- **Cost:** $10,000 (`Constants::SALESREP_REPORT_COST`)
- **Effect:** -1 performance modifier for all reps
- **Validation:** None

### Territory/Map Report
- **Field Name:** `territory_report`
- **Type:** Boolean (checkbox: "1" for purchased, empty/0 for not)
- **Cost:** Reduced salesperson performance (-1 modifier)
- **Effect:** Shows how other companies assign territories
- **Validation:** None

### Competitive Compensation Report
- **Field Name:** `compensation_report`
- **Type:** Boolean (checkbox: "1" for purchased, empty/0 for not)
- **Cost:** $10,000 (`Constants::COMPENSATION_REPORT_COST`)
- **Effect:** Information only, no performance modifier
- **Validation:** None

---

# 3. CONSTANTS (From legacy code)

## Business Constants
```php
MAX_HIRE_COUNT = 3              // Maximum reps to hire per quarter
MIN_REPS = 3                    // Minimum reps per company (firing constraint)
COST_OF_GOODS = 0.65            // 65% cost of goods
TOTAL_PERFORMANCE = 40          // Base performance metric
POTENTIAL_PER_PERSON = 21.78    // Territory potential
POPULATION_PER_UNIT = 20000     // Per territory unit
```

## Manager Compensation
```php
MANAGER_COMMISSION = 0.02       // 2% of total sales
MANAGER_SALARY_QTR = 20000      // $20,000 per quarter
MANAGER_TRAVEL_QTR = 750        // $750 per quarter
```

## Training & Hiring Expenses
```php
TRAINING_EXPENSES = 6000        // Per new hire
TERMINATION_EXPENSES = 15000    // Per fired rep
RECRUITING_BONUS = 2000         // Added to attractiveness index
```

## Overhead Expenses
```php
CLERICAL_EXPENSES = 10000       // Per quarter
RENT_AND_UTILITIES = 7500       // Per quarter (+/- random variance)
LEGAL_AND_OTHER = 10000         // Base per quarter
```

## Report Costs
```php
SALESREP_REPORT_COST = 10000    // Competitive salesperson report
COMPENSATION_REPORT_COST = 10000 // Competitive compensation report
```

## Attractiveness Calculation
```php
ASSUMED_SALES_PER_QTR = 300000  // For attractiveness index
```

## Sales Contest Costs
```php
Option 0: $0
Option 1: $50 per winner (steak knives)
Option 2: $1000 per winner (cash)
Option 3: $3000 per winner (vacation)
```

---

# 4. VALIDATION RULES SUMMARY

## Hiring Decision Validations

### Compensation
- Salary cannot be zero
- Commission cannot be zero
- Per diem required if travel=2
- Benefits must be 1, 2, or 3
- Travel must be 1, 2, or 3

### Training
- All training percentages must be non-negative
- Training percentages must sum to 100%
- Product knowledge ≥ 25%
- Selling techniques ≥ 30%

### Hiring
- Number to hire: 0-3
- Hiring list must be ordered and unique
- All team members' rankings combined via Borda count

### Firing
- Cannot fire below minimum team size (3 reps)
- Can only fire currently employed reps

## Leadership Decision Validations

### Territory Assignment
- All counties must be assigned
- Every rep must have at least one county
- Counties must be contiguous (per rep territory)

### Time Allocation
- All time percentages must be non-negative
- Time percentages must sum to 100%
- Recruiting ≥ 5%
- Meeting customers ≥ 5%
- Sales planning ≥ 5%

### Individual Hours
- All hours must be non-negative
- Hours must sum to calculated distribution amount
- Based on 50 hours/week manager assumption

### Leadership Behaviors
- One behavior must be selected per rep
- Behavior must be 1-5

### Market Reports
- All optional (checkboxes)
- Costs applied if selected

---

# 5. NOTICE SYSTEM (Business Rule Violations)

## Account Manager Notices (Rep-based)
These trigger based on rep composition:
- **AllMaleNotice**: All reps are male ($35,000 cost)
- **NoMinoritiesWarning**: No minority reps (warning, $0)
- **NoMinoritiesNotice**: No minority reps after warning ($25,000)
- **SexualHarasserNotice**: Ralph Wilkins is employed ($30,000)
- **FighterFitzgeraldNotice**: Fitzgerald St. James is employed ($30,000)
- **BriberyNotice**: Melanie Harrison is employed ($30,000)
- **FakeNewsNotice**: Heather Marowick is employed ($25,000)
- **AntitrustNotice**: Bristol O'Callahan Sr. is employed ($25,000)

## Decision Notices (Decision-based)
These trigger based on decision inputs:
- **InadequateProductTrainingNotice**: product_knowledge < 25% ($20,000)
- **InadequateSellingTrainingNotice**: selling_techniques < 30% ($30,000)
- **OwnExpensesNotice**: travel = 3 (reps pay own) ($0, morale problem)
- **LowPerDiemNotice**: travel=2 AND per_diem < 200 ($30,000)
- **SteakKnifeNotice**: sales_contest = 1 ($80,000)

## Special Notices
- **LeastAttractiveNotice**: Company has lowest attractiveness index in industry ($0)
- **ForgotTerritoryDecisionsNotice**: No decisions submitted ($100,000)

---

# 6. REP DATA (coreRepData.csv)

## Fixed Rep Attributes
```csv
name                    // Unique identifier
effort                  // 1-3, affects base performance
sales                   // 1-3, affects base performance
calls_per_qtr           // Total calls per quarter
correct_leadership_behavior  // 1-5, the "right" behavior
incorrect_leadership_behavior // 1-5, the "wrong" behavior
gender                  // M or F
is_minority             // 0 or 1
education               // Text description
experience              // Text description
intelligence            // Score (affects potential)
myers_briggs            // Personality type
other_info              // Additional context
interview               // Interview text
reference_check         // Reference text
ind_hrs_0_1             // Performance modifier value
ind_hrs_2_plus          // Performance modifier value
```

## Usage in Compilation
- **Base Performance**: `effort * sales`
- **Performance Modifiers**: Added to base performance
- **Leadership**: +1 if correct behavior used, -1 if incorrect
- **Individual Hours**: Uses `ind_hrs_0_1` or `ind_hrs_2_plus` based on hours allocated
- **Notices**: Triggers based on rep attributes

---

# 7. COUNTY DATA (coreCountyData.csv)

## County Attributes
- County name
- Contiguity data (adjacent counties)
- Number of shops
- Market potential
- Geographic position (for SVG rendering)

## Usage in Compilation
- Territory assignment validation
- Sales calculations per territory
- Workload calculations for reps

---

# 8. QUIZ SYSTEM

## Hiring Quiz
Generated after hiring compilation with questions about:
1. Annual salary offered
2. Commission rate offered
3. Number of people hired
4. Number of reps poached
5. Size of new sales team
6. Training percentages (product, market, company, selling)

## Leadership Quiz
Generated after leadership compilation with questions about:
1. Which company generated most income
2. Current company position/ranking
3. Number of correct leader behaviors
4. Total sales contest expense
5. Which rep generated greatest contribution margin
6. Which rep has greatest workload

---

# 9. FINANCIAL CALCULATIONS

## Direct Expenses
- Total rep salaries: `salary * numReps / 4`
- Total commissions: `(commission / 100) * total_sales`
- Total benefits: Calculated based on package level
- Total contest budget: `salesContestCost() * numContestWinners()`
- Total travel: Calculated based on package level

## Overhead Expenses
- Manager commission: `total_sales * 0.02`
- Manager benefits: `(manager_commission + MANAGER_SALARY_QTR) * 0.2`
- Manager salary: $20,000 per quarter
- Manager travel: $750 per quarter
- Training expenses: `TRAINING_EXPENSES * numNewHires`
- Termination expenses: `TERMINATION_EXPENSES * numFires`
- Clerical expenses: $10,000 per quarter
- Rent and utilities: $7,500 +/- random variance
- Legal and other: $10,000 + notice costs
- Market research: Cost of purchased reports

## Revenue
- Total sales: Calculated per territory based on performance and market potential
- Gross margin: `total_sales * (1 - COST_OF_GOODS)` = `total_sales * 0.35`
- Net income: `gross_margin - total_expenses`

---

# 10. COMPILATION ORDER

## Hiring Compilation
1. Check all companies submitted decisions (or use defaults)
2. Fire all marked reps
3. Calculate attractiveness indices
4. Sort companies by attractiveness (descending)
5. Process hiring in order:
   - Try to hire from hiring list
   - Poaching rules apply
   - Minimum team size constraint
6. Generate hiring outcomes report
7. Generate hiring quiz

## Leadership Compilation
1. Check all companies submitted decisions (or use defaults)
2. Check for notices
3. Calculate performance for each rep
4. Calculate sales per territory
5. Generate financial reports
6. Generate rep performance reports
7. Generate leadership quiz

---

# IMPLEMENTATION NOTES

## Critical Constraints
1. **All percentage fields must sum to 100%** - validation must enforce this
2. **Minimum training requirements** - product_knowledge ≥ 25%, selling_techniques ≥ 30%
3. **Minimum supervision requirements** - recruiting, meeting_customers, sales_planning ≥ 5%
4. **Territory contiguity** - must validate geographic adjacency
5. **Firing constraint** - minimum 3 reps per company
6. **Maximum hiring** - 3 reps per quarter

## Data Flow
1. Students enter decisions → Real-time validation
2. Teacher compiles → Business logic validates + applies defaults if needed
3. Compilation generates outcomes → Reports generated
4. Quiz generated from outcomes → Students take quiz
5. Next round decisions open → Process repeats

## Validation Strategy
- **Real-time validation**: Prevent invalid inputs (negative numbers, wrong types)
- **Submit validation**: Check all constraints met (sums, minimums, maximums)
- **Compilation validation**: Final check, apply defaults if decisions missing
- **Notice system**: Warn about suboptimal decisions, apply penalties after compilation

---

**END OF DECISION SCHEMA REFERENCE**
