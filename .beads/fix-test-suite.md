# Bead: Fix Test Suite to Passing

**Priority**: High
**Track**: Implementation Foundation
**Estimated Complexity**: Medium

## Context

The test suite has **39 failing tests** out of 59 total tests. Analysis reveals the failures are primarily due to structural issues (module paths, exports, test dependencies) rather than missing business logic implementation.

**See also**: `.beads/test-suite-investigation.md` for detailed failure analysis.

## Objectives

1. Fix RLS function export issues causing "is not a function" errors
2. Correct API path references in compilation tests
3. Fix internal API path in leadership compilation code
4. Install missing test dependencies
5. Fix schema validation test data
6. Address myFunctions timeout issues

## Acceptance Criteria

- All 59 existing tests pass
- Test suite can run without errors
- No test timeouts
- All RLS tests properly verify access control

## Implementation Tasks

### Task 1: Fix RLS Function Exports (Blocks 21 tests)

**Problem**: `queryWithRLS` and `mutationWithRLS` cause "is not a function" errors.

**Files**: `convex/services/rowLevelSecurity.ts`

**Steps**:
1. Investigate why `queryWithRLS` and `mutationWithRLS` are not being exported properly
2. Check for circular dependencies in imports
3. Verify the functions are correctly exported from the module
4. Run tests to verify the fix

**Unblocks**: 21 tests across games, rankings, and myFunctions

### Task 2: Fix Internal API Path in Leadership Compilation (Blocks 7 tests)

**Problem**: `convex/compilation/leadership.ts:33` calls `ctx.api.domain.internal.listGameCompanies` but should call `ctx.api.internal.listGameCompanies`.

**Files**: `convex/compilation/leadership.ts`

**Steps**:
1. Change line 33 from `ctx.api.domain.internal.listGameCompanies` to `ctx.api.internal.listGameCompanies`
2. Verify no other instances of wrong domain.internal paths exist
3. Run leadership compilation tests

**Code change**:
```typescript
// Before:
const companies = await ctx.runQuery(ctx.api.domain.internal.listGameCompanies, { gameId });

// After:
const companies = await ctx.runQuery(ctx.api.internal.listGameCompanies, { gameId });
```

**Unblocks**: 7 leadership compilation tests

### Task 3: Update Test API Paths for Hiring Compilation (Blocks 6 tests)

**Problem**: Tests call `api.compilation.compileHiringDecisions` but should call `api.admin.compilation.compileHiringDecisions`.

**Files**: `convex/compilation/hiring.test.ts`

**Steps**:
1. Find all instances of `api.compilation.compileHiringDecisions` (lines 237, 347, 421, 536, 606, 697)
2. Replace with `api.admin.compilation.compileHiringDecisions`
3. Run hiring compilation tests

**Code changes**:
```typescript
// Before:
await t.action(api.compilation.compileHiringDecisions, { gameId, quarter });

// After:
await t.action(api.admin.compilation.compileHiringDecisions, { gameId, quarter });
```

**Unblocks**: 6 hiring compilation tests

### Task 4: Update Test API Paths for Leadership Compilation (Blocks 7 tests)

**Problem**: Tests call `api.compilation.leadership.compileLeadershipDecisions` but should call `api.admin.compilation.compileLeadershipDecisions`.

**Files**: `convex/compilation/leadership.test.ts`

**Steps**:
1. Find all instances of `api.compilation.leadership.compileLeadershipDecisions`
2. Replace with `api.admin.compilation.compileLeadershipDecisions`
3. Run leadership compilation tests

**Code changes**:
```typescript
// Before:
await t.action(api.compilation.leadership.compileLeadershipDecisions, { gameId, quarter });

// After:
await t.action(api.admin.compilation.compileLeadershipDecisions, { gameId, quarter });
```

**Unblocks**: 7 leadership compilation tests

### Task 5: Install Missing Test Dependencies (Blocks 4 test suites)

**Problem**: React component tests require `@testing-library/react` and `@tanstack/react-query`.

**Files**: `package.json`

**Steps**:
1. Install dev dependencies:
   ```bash
   npm install --save-dev @testing-library/react @testing-library/jest-dom @tanstack/react-query
   ```
2. Verify installation
3. Run React component tests

**Unblocks**: 4 test suites (FocusIndicator, TerritoryAssignment, student/index, teacher/dashboard)

### Task 6: Fix Schema Validation Test Data (Blocks 1 test)

**Problem**: `hiring decision schema validates training sum` test fails because training values don't sum to 100.

**Files**: `convex/domain/decisions/persistence.test.ts`

**Steps**:
1. Find the test that creates invalid hiring decision data
2. Update training values to sum to 100:
   - `trainingProductKnowledge: 25`
   - `trainingMarketOrientation: 25`
   - `trainingCompanyOrientation: 25`
   - `trainingSellingTechniques: 25`
3. Run decision persistence tests

**Unblocks**: 1 decision test

### Task 7: Fix myFunctions Timeout Issues (Blocks 4 tests)

**Problem**: `convex/myFunctions.test.ts` tests timeout after 5000ms.

**Files**: `convex/myFunctions.ts`

**Steps**:
1. Review the myFunctions implementation
2. Identify why `addNumber` is timing out
3. Fix the implementation or add proper error handling
4. Run myFunctions tests

**Unblocks**: 4 myFunctions tests

### Task 8: Regenerate Convex Generated Files

**Problem**: `convex/teacher/dashboard.test.ts` cannot import `./_generated/api`.

**Steps**:
1. Run `npx convex codegen` or `npx convex dev`
2. Verify generated files exist
3. Run teacher dashboard tests

**Unblocks**: 1 test suite

### Task 9: Fix RLS Test Approach (Blocks 5 tests)

**Problem**: `convex/services/rowLevelSecurity.test.ts` uses raw database access instead of RLS-wrapped queries, so RLS rules aren't tested.

**Files**: `convex/services/rowLevelSecurity.test.ts`

**Steps**:
1. Review the 5 failing RLS tests
2. Update tests to use RLS-wrapped query/mutation functions
3. Verify tests properly check RLS enforcement
4. Run RLS tests

**Note**: This may require updating the test approach or creating wrapper functions for testing.

**Unblocks**: 5 RLS tests

## Verification

After completing all tasks:

1. Run full test suite:
   ```bash
   npm run test:once
   ```

2. Verify output shows:
   - All 59 tests passing (or more if suite failures are fixed)
   - No errors
   - No timeouts

3. Check for any remaining failures and address them

## Dependencies

- None (this is foundational work)

## Related Beads

- `test-suite-investigation.md` - Detailed failure analysis
- Any beads that add new tests (ensure they follow correct patterns)

## Notes

- Most business logic is already implemented - these are structural fixes
- Focus on module paths, exports, and test setup rather than algorithmic changes
- RLS framework is well-designed; the issue is with how it's being tested/loaded
- Once structural issues are fixed, expect the test suite to be close to fully passing
