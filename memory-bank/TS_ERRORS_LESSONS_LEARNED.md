# TypeScript Error Root Causes: Lessons Learned

**Context**: Investigation into why parallel agent type fixes introduced 380+ TypeScript errors across 23 files.

**Date**: 2026-02-03
**Status**: Root cause analysis complete

---

## Executive Summary

The TypeScript errors were **not** caused by missing business logic or fundamental architecture flaws. Instead, they resulted from **three specific knowledge gaps** about Convex's internal API structure:

1. **Misunderstanding internal function imports** (`ctx.api.internal` vs `internal`)
2. **Incorrect API path structure** (confusion about `api.domain.internal` vs `api.internal`)
3. **Missing understanding of how `internal` and `api` exports work in Convex**

This document explains the root causes, correct patterns, and how to prevent similar errors.

---

## Root Cause Analysis

### Error Category 1: Internal Function Imports

#### The Problem

**What agents tried to do:**
```typescript
// WRONG - Uses ctx.api.internal which doesn't exist in actions
const companies = await ctx.runQuery(ctx.api.internal.listGameCompanies, { gameId });
```

**Why it failed:**
- In Convex **actions**, there is NO `ctx.api` object
- `ctx.api` only exists in **queries and mutations**, not **actions**
- Actions must import from the `internal` object directly from `_generated/api`

**The correct pattern:**
```typescript
// CORRECT - Import internal from API, use directly
import { internal } from "../_generated/api";

const companies = await ctx.runQuery(internal.listGameCompanies, { gameId });
```

**Knowledge gap:**
- ❌ **Misconception**: `ctx.api.internal.*` works in actions like it does in queries/mutations
- ✅ **Reality**: Actions import `internal` directly and use it standalone

**Where this appeared:**
- `/data/projects/capo/convex/compilation/hiring.ts` - lines 26, 50, 55, 60, 138
- `/data/projects/capo/convex/compilation/leadership.ts` - line 34

**Files affected:** 2 compilation files, ~10 function calls

---

### Error Category 2: API Path Structure Confusion

#### The Problem

**What agents tried to do:**
```typescript
// WRONG - Calls api.domain.internal which doesn't exist
const companies = await ctx.runQuery(api.domain.internal.listGameCompanies, { gameId });
```

**Why it failed:**
- Functions in `convex/internal/queries.ts` are exported at `api.internal.*`
- Functions in `convex/domain/internal.ts` are ALSO exported at `api.domain.internal.*`
- These are TWO SEPARATE MODULES with different purposes:
  - `api.internal.*` = General internal helpers (in `convex/internal/`)
  - `api.domain.internal.*` = Domain-specific internal helpers (in `convex/domain/internal/`)

**The correct pattern:**
```typescript
// For general internal helpers (listGameCompanies, getHiringDecision, etc.)
import { internal } from "../_generated/api";
await ctx.runQuery(internal.listGameCompanies, { gameId });

// For domain-specific internal helpers (getOrCreateDefaultLeadershipDecisions)
import { api } from "../_generated/api";
await ctx.runQuery(api.domain.internal.getOrCreateDefaultLeadershipDecisions, { companyId, quarter });
```

**Module structure:**
```
convex/
├── internal/
│   ├── queries.ts      → api.internal.listGameCompanies
│   └── mutations.ts    → api.internal.createHiringOutcomeReport
└── domain/
    └── internal.ts     → api.domain.internal.getOrCreateDefaultLeadershipDecisions
```

**Knowledge gap:**
- ❌ **Misconception**: All internal functions are at `api.internal.*`
- ✅ **Reality**: Internal functions are namespaced by their directory:
  - `convex/internal/*` → `api.internal.*`
  - `convex/domain/internal.ts` → `api.domain.internal.*`
  - `convex/admin/compilation.ts` → `api.admin.compilation.*` (public)

**Where this appeared:**
- `/data/projects/capo/convex/compilation/leadership.ts` - line 34

**Files affected:** 1 compilation file, 1 function call

---

### Error Category 3: Public vs Internal Function Confusion

#### The Problem

Tests were calling compilation functions at the wrong API path.

**What tests tried to do:**
```typescript
// WRONG - Calls internal function directly
await t.action(api.compilation.compileHiringDecisions, { gameId, quarter });
```

**Why it failed:**
- `api.compilation.compileHiringDecisions` doesn't exist
- The actual exports are:
  - `api.compilation._compileHiringDecisions` (internal, underscore-prefixed)
  - `api.admin.compilation.compileHiringDecisions` (public wrapper with auth)

**The correct pattern:**
```typescript
// Use the public admin wrapper (has auth checks)
await t.action(api.admin.compilation.compileHiringDecisions, { gameId, quarter });

// OR use internal directly if testing without auth
await t.action(api.compilation.hiring._compileHiringDecisions, { gameId, quarter });
```

**Module structure:**
```
convex/
├── compilation/
│   ├── hiring.ts       → api.compilation.hiring._compileHiringDecisions (internal)
│   ├── leadership.ts   → api.compilation.leadership._compileLeadershipDecisions (internal)
│   └── index.ts        → re-exports internal functions
└── admin/
    └── compilation.ts  → api.admin.compilation.compileHiringDecisions (public)
```

**Knowledge gap:**
- ❌ **Misconception**: Internal compilation functions are at `api.compilation.*`
- ✅ **Reality**:
  - Internal functions have underscore prefix: `api.compilation.hiring._compileHiringDecisions`
  - Public wrappers are at `api.admin.compilation.compileHiringDecisions`
  - Tests should use public wrappers unless explicitly testing internals

**Where this appeared:**
- `/data/projects/capo/convex/compilation/hiring.test.ts` - lines 237, 347, 421, 536, 606, 697
- `/data/projects/capo/convex/compilation/leadership.test.ts` - multiple lines

**Files affected:** 2 test files, ~13 test cases

---

## Correct Convex TypeScript Patterns

### Pattern 1: Calling Internal Functions from Actions

**DO:**
```typescript
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

export const myAction = action({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    // CORRECT: Import internal, use directly
    const companies = await ctx.runQuery(internal.listGameCompanies, { gameId });
    const result = await ctx.runMutation(internal.createHiringOutcomeReport, { ... });
    return result;
  },
});
```

**DON'T:**
```typescript
export const myAction = action({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    // WRONG: ctx.api doesn't exist in actions
    const companies = await ctx.runQuery(ctx.api.internal.listGameCompanies, { gameId });

    // WRONG: api is for queries/mutations only
    const companies = await ctx.runQuery(api.internal.listGameCompanies, { gameId });
  },
});
```

---

### Pattern 2: Calling Domain Internal Functions

**DO:**
```typescript
import { action } from "../_generated/server";
import { api, internal } from "../_generated/api";

export const myAction = action({
  args: { companyId: v.id("companies"), quarter: v.number() },
  handler: async (ctx, { companyId, quarter }) => {
    // CORRECT: General internal helpers
    const companies = await ctx.runQuery(internal.listGameCompanies, { gameId });

    // CORRECT: Domain-specific internal helpers
    const decisions = await ctx.runQuery(api.domain.internal.getOrCreateDefaultLeadershipDecisions, {
      companyId,
      quarter,
    });

    return decisions;
  },
});
```

**DON'T:**
```typescript
export const myAction = action({
  args: { companyId: v.id("companies"), quarter: v.number() },
  handler: async (ctx, { companyId, quarter }) => {
    // WRONG: Confusing general internal with domain internal
    const companies = await ctx.runQuery(api.domain.internal.listGameCompanies, { gameId });

    // WRONG: Confusing domain internal with general internal
    const decisions = await ctx.runQuery(internal.getOrCreateDefaultLeadershipDecisions, {
      companyId,
      quarter,
    });
  },
});
```

---

### Pattern 3: Test API Paths

**DO:**
```typescript
import { convexTest } from "convex-test";
import { api } from "../_generated/api";

test("compilation works", async () => {
  const t = convexTest(schema);

  // CORRECT: Use public wrapper (has auth checks)
  await t.action(api.admin.compilation.compileHiringDecisions, { gameId, quarter });

  // OR: Use internal directly (for testing logic without auth)
  await t.action(api.compilation.hiring._compileHiringDecisions, { gameId, quarter });
});
```

**DON'T:**
```typescript
test("compilation works", async () => {
  const t = convexTest(schema);

  // WRONG: api.compilation.compileHiringDecisions doesn't exist
  await t.action(api.compilation.compileHiringDecisions, { gameId, quarter });
});
```

---

### Pattern 4: Public vs Internal Function Organization

**Public functions** (no underscore prefix):
- Exported at `api.moduleName.functionName`
- Can be called from frontend
- Have authentication/authorization checks
- Example: `api.admin.compilation.compileHiringDecisions`

**Internal functions** (underscore prefix):
- Exported at `api.internal.moduleName._functionName`
- CANNOT be called from frontend
- Used by other Convex functions only
- No auth checks (trusted code path)
- Example: `api.compilation.hiring._compileHiringDecisions`

**Module organization:**
```
convex/
├── admin/
│   └── compilation.ts          → Public wrappers with auth
│       ├── compileHiringDecisions (public)
│       └── compileLeadershipDecisions (public)
└── compilation/
    ├── hiring.ts               → Internal logic (no auth)
    │   └── _compileHiringDecisions (internal)
    └── leadership.ts           → Internal logic (no auth)
        └── _compileLeadershipDecisions (internal)
```

---

## What Went Wrong: Agent Knowledge Gaps

### Gap 1: Actions don't have `ctx.api`

**Missing knowledge:**
- Convex **actions** have a different context than **queries/mutations**
- Actions: `ctx.runQuery()`, `ctx.runMutation()`, `ctx.runAction()`
- Queries/Mutations: `ctx.db.query()`, `ctx.api` doesn't exist here either
- The `api` and `internal` objects are imported from `_generated/api`, not from `ctx`

**Why this happened:**
- Agents assumed `ctx.api.internal.*` would work because `api.internal.*` exists
- Didn't understand that `api` and `internal` are module imports, not context properties

### Gap 2: Confusion about internal module namespaces

**Missing knowledge:**
- `convex/internal/` and `convex/domain/internal.ts` are different modules
- They export to different API paths:
  - `convex/internal/queries.ts` → `api.internal.listGameCompanies`
  - `convex/domain/internal.ts` → `api.domain.internal.getOrCreateDefaultLeadershipDecisions`
- The namespace matches the directory structure

**Why this happened:**
- Agents saw both had "internal" in the name and assumed they were the same
- Didn't check the actual export paths in `_generated/api.d.ts`

### Gap 3: Underscore prefix convention for internal functions

**Missing knowledge:**
- Convex convention: Internal functions start with underscore
- Public wrapper functions don't have underscore
- Tests should typically use public wrappers unless testing internals

**Why this happened:**
- Agents didn't know about the underscore convention
- Assumed internal functions would be at the "obvious" path without checking

---

## Prevention Checklist

### Before writing code that calls other Convex functions:

1. **Check the function type:**
   - [ ] Is this an action, query, or mutation?
   - [ ] Actions import `internal` directly, don't use `ctx.api`

2. **Check the module location:**
   - [ ] Is the function in `convex/internal/` or `convex/domain/internal.ts`?
   - [ ] Use `api.internal.*` for `convex/internal/*`
   - [ ] Use `api.domain.internal.*` for `convex/domain/internal.ts`

3. **Check the export path:**
   - [ ] Look at `_generated/api.d.ts` to find the actual path
   - [ ] Don't guess - verify the import path

4. **Check for underscore prefix:**
   - [ ] Internal functions have underscore: `_compileHiringDecisions`
   - [ ] Public functions don't: `compileHiringDecisions`
   - [ ] Use public wrappers in tests unless testing internals

5. **Verify with TypeScript:**
   - [ ] Let TypeScript guide you to the correct import
   - [ ] If autocomplete doesn't show it, the path is wrong

---

## Code Review Checklist

### Reviewer questions:

1. **Is this calling internal functions correctly?**
   - Actions: `import { internal }` and use `internal.functionName`
   - Queries/Mutations: `import { internal }` and use `internal.functionName`
   - Never use `ctx.api.internal.*`

2. **Is the API path correct?**
   - `api.internal.*` for `convex/internal/*` functions
   - `api.domain.internal.*` for `convex/domain/internal.ts` functions
   - `api.admin.compilation.*` for public compilation wrappers

3. **Are tests using the right path?**
   - Public wrappers: `api.admin.compilation.compileHiringDecisions`
   - Internal functions: `api.compilation.hiring._compileHiringDecisions`
   - Never: `api.compilation.compileHiringDecisions`

4. **Did you verify in `_generated/api.d.ts`?**
   - Check the actual export path
   - Don't assume based on file structure

---

## Examples: What the Agents Changed

### Example 1: Hiring Compilation (FIXED)

**Before (wrong):**
```typescript
// convex/compilation/hiring.ts
const companies = await ctx.runQuery(ctx.api.internal.listGameCompanies, { gameId });
```

**After (correct):**
```typescript
// convex/compilation/hiring.ts
import { internal } from "../_generated/api";

const companies = await ctx.runQuery(internal.listGameCompanies, { gameId });
```

**Why it was wrong:** `ctx.api` doesn't exist in actions.

---

### Example 2: Leadership Compilation (FIXED)

**Before (wrong):**
```typescript
// convex/compilation/leadership.ts
const companies = await ctx.runQuery(api.domain.internal.listGameCompanies, { gameId });
```

**After (correct):**
```typescript
// convex/compilation/leadership.ts
import { api } from "../_generated/api";

const companies = await ctx.runQuery(api.internal.listGameCompanies, { gameId });
```

**Why it was wrong:** `listGameCompanies` is in `convex/internal/queries.ts`, not `convex/domain/internal.ts`.

---

### Example 3: Test API Paths (FIXED)

**Before (wrong):**
```typescript
// convex/compilation/hiring.test.ts
await t.action(api.compilation.compileHiringDecisions, { gameId, quarter });
```

**After (correct):**
```typescript
// convex/compilation/hiring.test.ts
await t.action(api.admin.compilation.compileHiringDecisions, { gameId, quarter });
```

**Why it was wrong:** `api.compilation.compileHiringDecisions` doesn't exist. The public wrapper is at `api.admin.compilation.compileHiringDecisions`.

---

## Key Takeaways

1. **Actions don't have `ctx.api`** - Import `internal` directly from `_generated/api`
2. **Namespace matches directory** - `convex/internal/*` → `api.internal.*`, `convex/domain/internal.ts` → `api.domain.internal.*`
3. **Check the generated API** - Look at `_generated/api.d.ts` to find actual export paths
4. **Internal functions have underscores** - `_compileHiringDecisions` is internal, `compileHiringDecisions` is public
5. **Tests should use public wrappers** - Use `api.admin.compilation.compileHiringDecisions` unless testing internals

---

## Resources

- **Convex docs on function imports**: https://docs.convex.dev/advanced/functions
- **Generated API structure**: Check `convex/_generated/api.d.ts`
- **Internal vs public functions**: https://docs.convex.dev/advanced/server-only-functions

---

**Document status**: Complete
**Last updated**: 2026-02-03
**Related docs**:
- `/data/projects/capo/docs/test-investigation/fix-test-suite.md`
- `/data/projects/capo/docs/test-investigation/test-suite-investigation.md`
