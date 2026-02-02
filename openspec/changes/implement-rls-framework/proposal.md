## Why

The business simulation platform requires automatic, database-level access control to ensure students, teachers, and admins can only access data appropriate to their role. Without Row-Level Security (RLS), permission checks must be manually added to every function, creating security vulnerabilities if developers forget to check permissions. RLS provides defense-in-depth by enforcing access rules at the database layer, complementing the permission utilities already implemented.

## What Changes

- **New file**: `convex/services/rowLevelSecurity.ts` containing:
  - `rlsRules(ctx, user)` - Defines access rules for all tables based on user role
  - `queryWithRLS` - Custom query builder with automatic RLS enforcement
  - `mutationWithRLS` - Custom mutation builder with automatic RLS enforcement
  - RLS rules for 13 tables: games, companies, users, hiringDecisions, leadershipDecisions, activeReps, resumeRankings, hiringLists, repPerformanceReports, financialReports, hiringOutcomeReports, accessRequests, and static data tables
- **Integration**: Uses `convex-helpers` RLS utilities with `defaultPolicy: "deny"` for secure-by-default behavior
- **Testing**: Comprehensive integration tests for each role (admin/teacher/student) accessing different tables

## Capabilities

### New Capabilities
- `row-level-security`: Automatic database-level access control using convex-helpers RLS. Enforces role-based filtering on all queries and mutations with defense-in-depth security.

### Modified Capabilities
- None - This is new infrastructure that enables secure data access

## Impact

- **Dependencies**: Requires `convex-helpers` (already installed) and permissions utilities (Task 2.1, just completed)
- **Breaking Changes**: None - RLS is opt-in via `queryWithRLS` and `mutationWithRLS` builders
- **Migration**: Existing functions can migrate to RLS builders gradually
- **Testing**: Requires integration tests with realistic multi-tenant scenarios
