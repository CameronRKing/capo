# bd-3i7: TypeScript Error Fixes

## Problem
380 TypeScript errors across 23 files, deployed with `--typecheck=disable` workaround.

## Root Cause
The `convex/admin/compilation.ts` file was trying to reference internal functions via `api.internal.admin.compilation.*`, but Convex's internal function type system requires internal functions to be in the `convex/internal/` directory structure.

## Solution Implemented

### 1. Refactored Internal Function Calls
Changed from trying to call non-existent internal functions to using inline helper functions that call existing internal APIs:

**Before:**
```typescript
const status = await ctx.runQuery(api.internal.admin.compilation.checkSubmissionStatus, {...});
```

**After:**
```typescript
// Created inline helper function
async function checkSubmissionStatusInline(...) {
  const companies = await ctx.runQuery(api.internal.index.listGameCompanies, { gameId });
  // ... rest of logic
}

// Called directly from action
const status = await checkSubmissionStatusInline(ctx, gameId, quarter, "hiring");
```

### 2. Added Compilation Record Mutations
Created `createCompilationRecord` and `updateCompilationRecord` in `convex/internal/mutations.ts`:

```typescript
export const createCompilationRecord = mutation({
  args: {
    gameId: v.id("games"),
    quarter: v.number(),
    phase: v.union(v.literal("hiring"), v.literal("leadership")),
    compiledBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("compilations", {
      gameId: args.gameId,
      quarter: args.quarter,
      phase: args.phase,
      status: "pending",
      startedAt: Date.now(),
      compiledBy: args.compiledBy,
      companiesProcessed: 0,
    });
  },
});
```

### 3. Fixed Type Mismatches
Fixed `undefined` vs `null` type issues:

```typescript
// Before: Type 'undefined' is not assignable to type 'number | null'
completedAt: compilation.completedAt,

// After: Use nullish coalescing
completedAt: compilation.completedAt ?? null,
errorMessage: compilation.errorMessage ?? null,
```

### 4. Files Modified
- `/data/projects/capo/convex/admin/compilation.ts` - Refactored with inline helpers
- `/data/projects/capo/convex/internal/mutations.ts` - Added compilation record functions

## Verification
- ✅ `npx tsc --noEmit` passes with zero errors
- ✅ All type annotations correct
- ✅ No circular dependencies

## Deployment Status
Local TypeScript compilation passes. Cloud deployment may require:
1. Killing background `convex mcp start` process
2. Checking network connectivity
3. Running `npx convex deploy --yes` without timeout

## Lessons Learned
1. **Convex Internal Functions**: Must be in `convex/internal/` directory to be exposed via `api.internal.*`
2. **Type Augmentation**: Attempted `.d.ts` augmentation didn't work with Convex's codegen
3. **Inline Helpers**: When you can't use proper internal functions, create inline helper functions in the same file
4. **Null vs Undefined**: Convex schema fields use `null` for optional values, not `undefined`
