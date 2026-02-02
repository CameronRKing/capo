# Test Suite Investigation - Patterns and Failure Analysis

**Date**: 2025-02-02
**Purpose**: Analyze test suite failures to guide implementation effort

## Summary

The test suite has **39 failing tests** across 4 main test files (excluding skipped/suite failures). This bead identifies the patterns in failures and provides a roadmap for getting the test suite to passing.

---

## Test Failure Breakdown

| Test File | Total Tests | Failed | Status |
|-----------|-------------|--------|--------|
| `convex/domain/games.test.ts` | 6 | 6 | All failing |
| `convex/domain/rankings.test.ts` | 10 | 10 | All failing |
| `convex/compilation/leadership.test.ts` | 7 | 7 | All failing |
| `convex/compilation/hiring.test.ts` | 9 | 6 | 3 passing |
| `convex/services/rowLevelSecurity.test.ts` | 9 | 5 | 4 passing |
| `convex/domain/decisions/persistence.test.ts` | 13 | 1 | 12 passing |
| `convex/myFunctions.test.ts` | 5 | 4 | 1 passing |
| **TOTAL** | **59** | **39** | **20 passing** |

### Suite Failures (Cannot Run)

| Test File | Issue |
|-----------|-------|
| `convex/teacher/dashboard.test.ts` | Missing `./_generated/api` module |
| `src/components/collaboration/FocusIndicator.test.tsx` | Missing `@testing-library/react` |
| `infra/2-components/domain-specific/TerritoryAssignment.test.tsx` | Missing `@testing-library/react` |
| `src/routes/student/index.test.tsx` | Missing `@tanstack/react-query` |

---

## Pattern Analysis

### Pattern 1: Module Path Mismatches

**Issue**: Tests call functions at incorrect API paths.

**Tests call:**
- `api.compilation.compileHiringDecisions`
- `api.compilation.leadership.compileLeadershipDecisions`

**Actual exports:**
- `api.compilation._compileHiringDecisions` (internal, underscore-prefixed)
- `api.compilation._compileLeadershipDecisions` (internal, underscore-prefixed)
- `api.admin.compilation.compileHiringDecisions` (public wrapper)
- `api.admin.compilation.compileLeadershipDecisions` (public wrapper)

**Root cause**: Tests reference internal functions that have underscore prefixes, or should reference admin wrappers.

**Fix required**: Update test imports to use correct paths:
- Change `api.compilation.compileHiringDecisions` → `api.admin.compilation.compileHiringDecisions`
- Change `api.compilation.leadership.compileLeadershipDecisions` → `api.admin.compilation.compileLeadershipDecisions`

**Affected tests:**
- `convex/compilation/hiring.test.ts` - lines 237, 347, 421, 536, 606, 697

---

### Pattern 2: RLS Function Export Issues

**Issue**: `queryWithRLS` and `mutationWithRLS` functions cause "is not a function" errors.

**Error message:**
```
TypeError: (0,__vite_ssr_import_0__.queryWithRLS) is not a function
```

**Location**: `convex/domain/users.ts:49:30`

**Root cause**: The functions are imported from `../services/rowLevelSecurity` and used to create queries, but there may be an issue with:
1. Circular dependencies
2. Module loading order
3. Export/import mismatch

**Files affected:**
- `convex/domain/games.ts` - uses `queryWithRLS` for all queries
- `convex/domain/rankings.test.ts` - tests RLS-protected queries
- `convex/domain/users.ts` - uses `queryWithRLS`
- `convex/services/rowLevelSecurity.test.ts` - tests RLS framework

**Fix required**: Investigate RLS module exports and ensure functions are properly exported/imported.

---

### Pattern 3: Missing Internal API Functions

**Issue**: Compilation functions call internal API functions that don't exist or are at wrong paths.

**Missing/wrong paths in compilation code:**

| Called As | Should Be |
|-----------|-----------|
| `ctx.api.internal.listGameCompanies` | ✓ exists (in `internal/queries.ts`) |
| `ctx.api.internal.getHiringDecision` | ✓ exists (in `internal/queries.ts`) |
| `ctx.api.internal.getActiveReps` | ✓ exists (in `internal/queries.ts`) |
| `ctx.api.internal.getHiringList` | ✓ exists (in `internal/queries.ts`) |
| `ctx.api.internal.createHiringOutcomeReport` | ✓ exists (in `internal/mutations.ts`) |

**In leadership compilation (calling wrong domain.internal path):**
- `ctx.api.domain.internal.listGameCompanies` → should be `ctx.api.internal.listGameCompanies`
- `ctx.api.domain.internal.getOrCreateDefaultLeadershipDecisions` → ✓ exists (in `domain/internal.ts`)
- `ctx.api.domain.internal.listActiveRepsByCompanyQuarter` → ✓ exists (in `domain/internal.ts`)

**Report functions (all exist):**
- `ctx.api.domain.reports.createRepPerformance` → ✓ exists
- `ctx.api.domain.reports.createFinancial` → ✓ exists

**Fix required**: Update `convex/compilation/leadership.ts` line 33:
```typescript
// Wrong:
const companies = await ctx.runQuery(ctx.api.domain.internal.listGameCompanies, { gameId });

// Should be:
const companies = await ctx.runQuery(ctx.api.internal.listGameCompanies, { gameId });
```

---

### Pattern 4: Schema Validation Failures

**Issue**: Decision schema validation fails for training sum requirements.

**Failing test:**
```
convex/domain/decisions/persistence.test.ts > hiring decision schema validates training sum
```

**Root cause**: The hiring decision schema requires `trainingProductKnowledge + trainingMarketOrientation + trainingCompanyOrientation + trainingSellingTechniques` to equal 100, but the test data may not satisfy this constraint.

**Fix required**: Either:
1. Update test to provide valid training values that sum to 100
2. Check if schema validator is working correctly

---

### Pattern 5: Missing Test Dependencies

**Issue**: Some test files require npm packages that aren't installed.

**Missing packages:**
- `@testing-library/react` - for React component tests
- `@tanstack/react-query` - for React Query integration tests

**Affected test files:**
- `src/components/collaboration/FocusIndicator.test.tsx`
- `infra/2-components/domain-specific/TerritoryAssignment.test.tsx`
- `src/routes/student/index.test.tsx`

**Fix required**: Install missing dependencies:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @tanstack/react-query
```

---

### Pattern 6: Missing Generated Files

**Issue**: `convex/teacher/dashboard.test.ts` cannot import `./_generated/api`.

**Root cause**: The Convex generated files may not exist or need to be regenerated.

**Fix required**: Run `npx convex dev` or `npx convex codegen` to regenerate API files.

---

## Detailed Failure Analysis by Test File

### `convex/domain/games.test.ts` (6/6 failing)

All games tests fail because they use `api.games.*` queries that are built with `queryWithRLS`, which has the "is not a function" issue.

**Tests affected:**
1. `getGame - returns game by ID`
2. `getCurrentPhase - returns quarter and phase info`
3. `getPhaseStatus - returns not submitted for hiring phase`
4. `getPhaseStatus - returns submitted status for hiring phase`
5. `getPhaseStatus - works for leadership phase`
6. `getPhaseStatus - returns submitted for leadership phase`

**Fix required**: Fix the RLS function export issue (Pattern 2).

---

### `convex/domain/rankings.test.ts` (10/10 failing)

All rankings tests fail because they test RLS behavior, but the RLS framework has the "is not a function" issue.

**Tests affected:**
1. `student can read their own rankings`
2. `student can read teammates rankings`
3. `student CANNOT modify teammates rankings`
4. `student CANNOT delete teammates rankings`
5. `teacher can read all student rankings in their game`
6. `teacher CANNOT modify student rankings`
7. `admin has full access to rankings`
8. `batch save updates multiple rankings efficiently`
9. `getUnrankedResumes returns unranked resumes`
10. `getRankingSummary returns correct counts`

**Fix required**: Fix the RLS function export issue (Pattern 2).

---

### `convex/compilation/leadership.test.ts` (7/7 failing)

All leadership compilation tests fail because they call the wrong API path and have the internal function path issue.

**Tests affected:**
1. `should generate rep performance data with valid ranges`
2. `should generate balanced financial reports`
3. `should calculate manager commission correctly`
4. `should handle market research expenses correctly`
5. `should handle multiple companies in parallel`
6. `should handle company with no leadership decisions (apply defaults)`
7. `should calculate rep contribution margin correctly`

**Fix required:**
1. Update test calls to use `api.admin.compilation.compileLeadershipDecisions`
2. Fix the internal API path in `convex/compilation/leadership.ts` (Pattern 3)

---

### `convex/compilation/hiring.test.ts` (6/9 failing, 3 passing)

**Passing tests:**
1. ✓ `calculate attractiveness: base compensation`
2. ✓ `calculate attractiveness: with benefits`
3. ✓ `calculate attractiveness: with sales contest`

**Failing tests** (all call wrong API path):
1. `poaching rule: Q1 prohibition` - calls `api.compilation.compileHiringDecisions`
2. `poaching rule: MIN_REPS protection` - calls `api.compilation.compileHiringDecisions`
3. `hiring draft: basic selection` - calls `api.compilation.compileHiringDecisions`
4. `hiring draft: priority order` - calls `api.compilation.compileHiringDecisions`
5. `stub data generation: reproducibility` - calls `api.compilation.compileHiringDecisions`
6. `integration: full hiring compilation` - calls `api.compilation.compileHiringDecisions`

**Fix required:** Update test calls to use `api.admin.compilation.compileHiringDecisions` (Pattern 1).

---

### `convex/services/rowLevelSecurity.test.ts` (5/9 failing, 4 passing)

**Passing tests:**
1. ✓ `Admin can read all games`
2. ✓ `Teacher can read all companies in their game`
3. ✓ `Students can modify their company decisions`
4. ✓ `Admin can read/write everything`

**Failing tests** (all related to RLS filtering not working):
1. `Teacher can only read their assigned game`
2. `Student can only read their assigned game`
3. `Student can only read their company`
4. `Student cannot query other companies (denied by RLS)`
5. `Students cannot modify other companies' decisions`

**Root cause**: The RLS wrapper isn't being applied in the tests. The tests use raw `ctx.db` without going through `queryWithRLS`.

**Fix required**: The tests need to either:
1. Use RLS-wrapped queries instead of raw database access
2. Or verify that the RLS rules are being applied correctly in the wrapped functions

---

### `convex/domain/decisions/persistence.test.ts` (1/13 failing, 12 passing)

**Passing tests:** 12 tests for draft creation, updates, submission all passing ✓

**Failing test:**
1. `hiring decision schema validates training sum` - Schema validation failing

**Fix required**: Check test data or schema validator (Pattern 4).

---

### `convex/myFunctions.test.ts` (4/5 failing, 1 passing)

**Passing test:**
1. ✓ `direct database access with t.run`

**Failing tests:**
1. `addNumber and listNumbers` - Timeout (5000ms)
2. `listNumbers returns empty array initially` - Timeout
3. `listNumbers respects count argument` - RLS function issue
4. `querying all numbers from database` - RLS function issue

**Root causes:**
- Timeouts suggest the myFunctions may not be implemented yet
- RLS function issue for the other tests

**Fix required:**
1. Implement or fix `myFunctions` in the Convex functions
2. Fix RLS function exports

---

## Implementation Roadmap

### Phase 1: Critical Infrastructure (Blocks most tests)

1. **Fix RLS function exports** (Pattern 2)
   - Investigate `queryWithRLS` and `mutationWithRLS` export issues
   - Fix circular dependencies if any
   - Verify functions are properly exported from `convex/services/rowLevelSecurity.ts`
   - **Unblocks**: games tests (6), rankings tests (10), some RLS tests (5)

2. **Fix compilation API paths** (Pattern 1 & 3)
   - Update `convex/compilation/leadership.ts` line 33 to use correct internal API
   - Update all test files to call `api.admin.compilation.*` instead of `api.compilation.*`
   - **Unblocks**: leadership tests (7), hiring tests (6)

### Phase 2: Test Infrastructure

3. **Install missing test dependencies** (Pattern 5)
   - `npm install --save-dev @testing-library/react @testing-library/jest-dom @tanstack/react-query`
   - **Unblocks**: React component tests (4 suites)

4. **Regenerate Convex generated files** (Pattern 6)
   - Run `npx convex codegen`
   - **Unblocks**: teacher dashboard tests

### Phase 3: Schema and Implementation Fixes

5. **Fix schema validation** (Pattern 4)
   - Update hiring decision test data to satisfy training sum = 100
   - Or adjust schema validator if needed
   - **Unblocks**: 1 decision test

6. **Fix myFunctions implementation**
   - Implement or fix timeout issues in `convex/myFunctions.ts`
   - **Unblocks**: 4 myFunctions tests

### Phase 4: RLS Test Corrections

7. **Fix RLS test expectations** (Pattern 2 - rowLevelSecurity tests)
   - Tests are using raw database access instead of RLS-wrapped queries
   - Update tests to verify RLS rules through actual wrapped functions
   - **Unblocks**: 5 RLS tests

---

## Expected Test Counts After Fixes

| Phase | Tests Fixed | Remaining Failures | Cumulative Passing |
|-------|-------------|-------------------|-------------------|
| Start | - | 39 | 20 |
| Phase 1 (RLS exports) | 21 | 18 | 41 |
| Phase 1 (API paths) | 13 | 5 | 54 |
| Phase 2 (Dependencies) | 4 suites | 5 | 58 |
| Phase 3 (Schema/Impl) | 5 | 0 | 63 |
| Phase 4 (RLS tests) | 5 | 0 | 68 |

**Note**: Suite failures will add more tests once they can run.

---

## Files Requiring Changes

### High Priority (Phase 1)

1. `convex/services/rowLevelSecurity.ts` - Fix exports
2. `convex/compilation/leadership.ts` - Fix internal API path (line 33)
3. `convex/compilation/hiring.test.ts` - Update API calls (6 locations)
4. `convex/compilation/leadership.test.ts` - Update API calls (7 locations)

### Medium Priority (Phase 2-3)

5. `package.json` - Add dev dependencies
6. `convex/domain/decisions/persistence.test.ts` - Fix training sum test data
7. `convex/myFunctions.ts` - Implement or fix timeout issues
8. `convex/_generated/api.*` - Regenerate

### Lower Priority (Phase 4)

9. `convex/services/rowLevelSecurity.test.ts` - Update test approach for RLS verification

---

## Notes

- The core business logic appears to be implemented (most passing tests are for actual logic)
- Main issues are structural: module paths, exports, and test setup
- RLS framework is well-designed but has a module loading/export issue
- Once structural issues are fixed, the test suite should be close to fully passing
- React component tests are blocked by missing dev dependencies, not implementation issues
