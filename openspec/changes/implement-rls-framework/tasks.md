## 1. Core Implementation

- [x] 1.1 Create convex/services/rowLevelSecurity.ts file
- [x] 1.2 Import required dependencies (convex-helpers, permissions)
- [x] 1.3 Implement rlsRules function with games table rules
- [x] 1.4 Add companies table RLS rules
- [x] 1.5 Add users table RLS rules
- [x] 1.6 Add hiringDecisions table RLS rules
- [x] 1.7 Add leadershipDecisions table RLS rules
- [x] 1.8 Add activeReps table RLS rules
- [x] 1.9 Add reports tables RLS rules (repPerformanceReports, financialReports)
- [x] 1.10 Add remaining tables RLS rules (resumeRankings, hiringLists, accessRequests, resumes, counties)
- [x] 1.11 Implement queryWithRLS custom query builder
- [x] 1.12 Implement mutationWithRLS custom mutation builder
- [x] 1.13 Export all RLS utilities

## 2. Testing

- [x] 2.1 Create convex/services/rowLevelSecurity.test.ts
- [x] 2.2 Write test helpers for creating test users (admin/teacher/student)
- [x] 2.3 Write test: Admin can read all games
- [x] 2.4 Write test: Teacher can only read their game
- [x] 2.5 Write test: Student can only read their company
- [x] 2.6 Write test: Student cannot query other companies (denied)
- [x] 2.7 Write test: Teacher cannot modify other games (denied)
- [x] 2.8 Write test: Admin can read/write everything
- [x] 2.9 Write test: Students can modify their company decisions
- [x] 2.10 Write test: Students cannot modify other companies' decisions

## 3. Verification

- [x] 3.1 Run all RLS tests and verify they pass
- [x] 3.2 Check TypeScript compilation
- [x] 3.3 Verify all tables have RLS rules
- [x] 3.4 Verify defaultPolicy: "deny" is set
