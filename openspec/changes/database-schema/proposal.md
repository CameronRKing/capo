# Proposal: Database Schema

## Why

The entire business simulation platform requires a comprehensive database schema that supports users, games, companies, decisions, reports, and collaboration. This schema serves as the foundation for all other features and must be designed to support real-time reactivity, access control, and data persistence across compilations.

## What Changes

- **User & Authentication Tables**:
  - `users`: Core user records with email, name, role (admin/teacher/student), created_at
  - `access_requests`: Pending access requests with name, email, role, requested_game_id, status (pending/approved/denied)
  - `magic_links`: Temporary tokens for authentication with email, token, expires_at, used_at
  - `user_assignments`: Link users to games/companies with game_id, company_id, role
- **Game Structure Tables**:
  - `games`: Simulation instances with name, industry_count, current_quarter, current_phase, status
  - `industries`: Industry groups within games with game_id, name, company_count
  - `companies`: Companies within industries with industry_id, name, assigned_students (array of user_ids)
- **Decision Tables** (Hiring):
  - `hiring_decisions_working`: Draft hiring decisions with company_id, quarter, salary, commission, benefits, travel, per_diem, sales_contest, sales_contest_is_open, sales_contest_threshold, training percentages, num_to_hire, hiring_list, firing
  - `hiring_decisions_submitted`: Submitted hiring decisions (same schema) + submitted_by, submitted_at
- **Decision Tables** (Leadership):
  - `leadership_decisions_working`: Draft leadership decisions with company_id, quarter, recruiting, meeting_customers, sales_planning, administrative_paperwork, individual_hours (per rep), leadership_behaviors (per rep), territories (county assignments), market_reports flags
  - `leadership_decisions_submitted`: Submitted leadership decisions (same schema) + submitted_by, submitted_at
- **Ranking Tables**:
  - `student_rankings`: Per-student resume rankings with student_id, company_id, quarter, rankings (A/B/C groups with ordered rep IDs)
  - `combined_hiring_lists`: Final hiring lists per company with company_id, quarter, hiring_list (ordered rep IDs)
- **Report Tables**:
  - `finances`: Quarterly financial reports with company_id, quarter, total_sales, direct_expenses, overhead_expenses, gross_margin, net_income, plus all expense line items
  - `hiring_outcomes`: Hiring results with company_id, quarter, oldRepOutcomes (poached/retained/fired), newRepOutcomes (hired)
  - `rep_performance`: Rep performance reports with company_id, quarter, rep_id, name, sales, daysWorked, totalCalls, battingAvg, workload, salary, commission, expenses, contributionMargin, behavior, marketShare
  - `market_reports_acct_mgr`: Purchased market research (account manager sales) with company_id, quarter, reps data
  - `market_reports_compensation`: Purchased market research (compensation packages) with company_id, quarter, decisions data
  - `market_reports_territories`: Purchased market research (territory assignments) with company_id, quarter, companyMaps data
- **Rep Data Tables**:
  - `active_reps`: Current quarter rep assignments with rep_id (references resume data), company_id, quarter, total_sales, calls_made, performance, individual_hours, leadership_behavior, territory_assignments
  - `resumes`: Static resume data (70 reps) with id, name, gender, education, experience, intelligence, myers_briggs, other_info, interview, reference_check
  - `rep_performance_hidden`: Hidden performance data with rep_id, effort, sales, calls_per_qtr, correct_leadership_behavior, incorrect_leadership_behavior, ind_hrs_0_1, ind_hrs_2_plus
- **Territory Tables**:
  - `territories`: County assignments per company per quarter with company_id, quarter, county_id, rep1_id, rep2_id, rep3_id, rep4_id, rep1_sales, rep2_sales, rep3_sales, rep4_sales
  - `counties`: Static county data (88 Ohio counties) with id, name, shops, market_potential, adjacencies (for contiguity validation)
- **Presence Tables**:
  - `presence_sessions`: Tracking user presence per room with session_id, user_id, room_id (company_id), last_seen, status (online/offline)
  - `presence_focus`: Tracking user focus on properties with user_id, room_id, property_path, focused_at

## Capabilities

### New Capabilities

- `user-auth-schema`: User identity and authentication data structures, access request workflow storage, magic link token management, role-based assignment records

- `game-structure-schema`: Game, industry, and company hierarchies, quarter/phase tracking, student-company assignments, game state management

- `decision-storage-schema`: Working and submitted decision documents for both hiring and leadership phases, draft vs submitted separation, submission audit trail

- `report-storage-schema`: All report types (finances, hiring outcomes, rep performance, market reports), quarterly historical data, cross-company comparison support

- `rep-data-schema`: Resume data (public), hidden performance data (private), active rep assignments per quarter, territory assignments

- `collaboration-schema`: Presence tracking sessions, user focus tracking, room-based organization

### Modified Capabilities

None (foundational schema for all features)

## Impact

**Affected Systems:**
- **Convex schema.ts**: Define all tables with validators (v.*)
- **Database indexes**: Add indexes for common query patterns (company_id, quarter, user_id, game_id)
- **Row-level security**: Define access rules per table based on user role
- **Data relationships**: Establish document references (v.id()) for foreign keys
- **Migrations**: Plan for schema evolution

**Data Volume Estimates:**
- Users: ~100 per simulation
- Games: Ongoing (simulations created per term)
- Companies: 4 per industry, multiple industries per game
- Decisions: 2 per company per quarter (hiring + leadership)
- Reports: 1 per company per quarter per type
- Active reps: ~70 max * 4 companies = 280 rep records per quarter

**Breaking Changes:**
- None (new schema definition)

**Critical Indexes:**
- `hiring_decisions_submissions`: [company_id, quarter]
- `leadership_decisions_submissions`: [company_id, quarter]
- `finances`: [company_id, quarter]
- `active_reps`: [company_id, quarter]
- `student_rankings`: [student_id, company_id, quarter]
- `user_assignments`: [user_id, game_id]
- `presence_sessions`: [room_id, last_seen]

**Access Control Rules:**
- `resumes`: Public read (all authenticated users)
- `rep_performance_hidden`: Admin write only, students CANNOT read
- `hiring_decisions_working`: Read/write by assigned company members
- `hiring_decisions_submissions`: Read by company members, write by compilation function only
- `finances`: Read by own company (students) or all companies in simulation (teachers)
- `student_rankings`: Read by all company members, write by owner only
- `presence_sessions`: Read by room members, write by room members

**Schema Validation:**
- All tables use Convex validators (v.string(), v.number(), etc.)
- Complex validation via custom validators (e.g., sum to 100%)
- AJV integration for cross-field constraints
- Default values where appropriate
- Optional fields marked explicitly
