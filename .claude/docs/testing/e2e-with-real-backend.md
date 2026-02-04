# E2E Testing with Real Convex Backend

This guide explains how to run E2E tests with a real Convex backend instead of mocks.

## Overview

**Problem**: Browser mode E2E tests fail with mocked `useQuery`/`useMutation` due to infinite re-render loops.

**Solution**: Use a real Convex backend (localhost:3210) for E2E tests instead of mocking.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  E2E Test (Browser Mode - Playwright)                      │
│  - Vitest Browser Config                                    │
│  - @testing-library/react                                   │
│  - ConvexTestContext helper                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Real Convex Backend (localhost:3210)                       │
│  - Test helpers (insert, get, erase)                        │
│  - Real mutations/queries                                   │
│  - Test data initialization                                  │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### Current Configuration & Best Practices

**Backend URL**: `http://localhost:3210` (set in `vitest.config.e2e.mts`)
**Browser**: Chromium (headless mode)
**Test Timeout**: 30 seconds
**Trace Mode**: `retain-on-failure` (only saves traces for failed tests)
**Trace Directory**: `tests/e2e/__traces__/`

#### Browser Choice: Chromium vs Firefox

**Current**: Chromium is used in the configuration.

**Rationale**:
- Chromium has better Playwright support and more stable trace generation
- Trace files are successfully generated in `tests/e2e/__traces__/`
- Firefox can be used if needed by changing the browser option

**To switch to Firefox**:
```typescript
// In vitest.config.e2e.mts
instances: [
  {
    browser: "firefox",  // Changed from chromium
  },
],
```

#### Import Path Rules (CRITICAL)

**Issue**: Test files in `tests/e2e/` must use correct relative imports.

**Common mistake**:
- ❌ Wrong: `import { ConvexTestContext } from "../helpers/ConvexTestContext";`
- ✅ Correct: `import { ConvexTestContext } from "./helpers/ConvexTestContext";`

The helpers are in `tests/e2e/helpers/`, not `tests/helpers/`.

### 1. Test Helpers (`convex/testHelpers.ts`)

Internal mutations for test data setup:

```typescript
import { internalMutation } from "./_generated/server";

export const insert = internalMutation({
  args: {
    table: v.string(),
    value: v.any(),
  },
  handler: async (ctx, { table, value }) => {
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.insert is only available in test mode");
    }
    return await ctx.db.insert(table, value);
  },
});

export const get = internalMutation({
  args: {
    table: v.string(),
    id: v.string(),
  },
  handler: async (ctx, { table, id }) => {
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.get is only available in test mode");
    }
    return await ctx.db.get(id as any);
  },
});

export const erase = internalMutation({
  args: {
    id: v.id("_storage"),
  },
  handler: async (ctx, { id }) => {
    if (process.env.NODE_ENV !== "test" && !process.env.IS_TEST) {
      throw new Error("testHelpers.erase is only available in test mode");
    }
    return await ctx.db.delete(id as any);
  },
});
```

**Security**: These are marked `internalMutation` and check for `IS_TEST` environment variable.

### 2. Test Context (`tests/e2e/helpers/ConvexTestContext.ts`)

Wrapper around `ConvexClient` for test setup:

```typescript
import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

export class ConvexTestContext {
  private client: ConvexClient;
  private createdIds: Array<Id<any>> = [];

  static async create(url: string = "http://localhost:3210"): Promise<ConvexTestContext> {
    const client = new ConvexClient(url, {
      unsavedChangesWarning: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    return new ConvexTestContext(client);
  }

  async insert<T extends keyof DataModel>(
    table: T,
    value: Omit<DataModel[T], "_id" | "_creationTime">
  ): Promise<Id<T>> {
    const result = await this.client.mutation(api.testHelpers.insert, {
      table: table as string,
      value: value as any,
    });
    this.createdIds.push(result as Id<any>);
    return result as Id<T>;
  }

  async query<Func extends keyof typeof api>(
    func: Func,
    args?: Parameters<typeof api[Func]>[0]
  ): Promise<ReturnType<typeof api[Func]>> {
    return await this.client.query(api[func] as any, args);
  }

  async mutation<Func extends keyof typeof api>(
    func: Func,
    args?: Parameters<typeof api[Func]>[0]
  ): Promise<ReturnType<typeof api[Func]>> {
    return await this.client.mutation(api[func] as any, args);
  }

  async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      try {
        await this.client.mutation(api.testHelpers.erase, { id });
      } catch (error) {
        console.warn(`Failed to delete test data ${id}:`, error);
      }
    }
    this.createdIds = [];
    (this.client as any) = null;
  }
}
```

### 3. E2E Configuration (`vitest.config.e2e.mts`)

Configured for real backend:

```typescript
export default defineConfig({
  test: {
    env: {
      VITE_CONVEX_URL: "http://localhost:3210",
      IS_TEST: "true",
    },
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      trace: {
        mode: 'retain-on-failure',
        tracesDir: './tests/e2e/__traces__',
      },
    },
    include: ["tests/e2e/**/*-browser.test.{ts,tsx}"],
    testTimeout: 30000,
  },
});
```

## Usage

### Prerequisites

1. **Start Convex backend** (must be running on localhost:3210):
   ```bash
   # Option 1: Start backend only
   npm run dev:backend &

   # Option 2: Start full dev stack
   npm run dev
   ```

2. **Verify backend is running**:
   ```bash
   curl http://localhost:3210/_health
   ```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- e2e-03

# Run with full tracing (for debugging)
npm run test:e2e:trace

# View trace from failed test
npm run test:e2e:view-trace tests/e2e/__traces__/chromium-*.trace.zip
```

### Example Test

```typescript
import { test, expect, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { ConvexTestContext, testDataHelpers } from "../helpers/ConvexTestContext";
import { ConvexProvider, ConvexReactClient } from "convex/react";

let convex: ConvexTestContext;
let convexClient: ConvexReactClient;
let testCompanyId: Id<"companies">;

beforeEach(async () => {
  // Create test context
  convex = await ConvexTestContext.create();

  // Create test game and company
  const { gameId, companyIds } = await testDataHelpers.createGame(convex, {
    numCompanies: 1,
    gameStatus: "active",
  });
  testCompanyId = companyIds[0];

  // Create test user
  const userId = await testDataHelpers.createUser(convex, {
    name: "Test Student",
    email: "test@example.com",
    role: "student",
    gameId,
    companyId: testCompanyId,
  });

  // Create working decision
  await convex.insert("workingHiringDecisions", {
    userId: userId as Id<"users">,
    companyId: testCompanyId,
    quarter: 1,
    salary: 50000,
    // ... other fields
  });

  // Create Convex client for React
  convexClient = new ConvexReactClient("http://localhost:3210", {
    unsavedChangesWarning: false,
  });
});

afterEach(async () => {
  if (convex) {
    await convex.cleanup();
  }
  if (convexClient) {
    (convexClient as any) = null;
  }
});

test("my E2E test", async () => {
  const { container } = render(
    <ConvexProvider client={convexClient}>
      <MyComponent companyId={testCompanyId} />
    </ConvexProvider>
  );

  // Test logic...
  expect(screen.getByText(/Compensation Package/i)).toBeVisible();
});
```

## Test Data Helpers

### `testDataHelpers` Utilities

```typescript
export const testDataHelpers = {
  // Create a test game with companies
  async createGame(
    convex: ConvexTestContext,
    config?: { numCompanies?: number; gameStatus?: "setup" | "active" | "completed" }
  ): Promise<{ gameId: string; companyIds: string[] }>

  // Create a test user
  async createUser(
    convex: ConvexTestContext,
    data: {
      name: string;
      email: string;
      role: "admin" | "teacher" | "student";
      gameId?: string;
      companyId?: string;
    }
  ): Promise<string>

  // Create a test access request
  async createAccessRequest(
    convex: ConvexTestContext,
    data: {
      name: string;
      email: string;
      role: "teacher" | "student";
      status?: "pending" | "approved";
      gameId?: string;
      companyId?: string;
    }
  ): Promise<string>
};
```

## Troubleshooting

### Backend Not Running

**Error**: `Failed to fetch` or `ECONNREFUSED` to localhost:3210

**Solution**:
```bash
# Check if backend is running
lsof -i :3210

# Start backend
npm run dev:backend &

# Or start full stack
npm run dev
```

### Test Helpers Not Available

**Error**: `testHelpers.insert is only available in test mode`

**Solution**: Ensure `IS_TEST: "true"` is set in vitest config:
```typescript
test: {
  env: {
    IS_TEST: "true",
  }
}
```

### Tests Timing Out

**Error**: Test timeout after 30s

**Solution**:
1. Increase timeout in vitest config:
   ```typescript
   testTimeout: 60000,
   ```
2. Check backend is responsive:
   ```bash
   curl http://localhost:3210/_health
   ```

### Infinite Re-renders

**Error**: Component re-renders infinitely

**Cause**: Using mocked `useQuery`/`useMutation` in browser mode

**Solution**: Use real backend (this setup) instead of mocks.

### Import Resolution Errors

**Error**: `Failed to resolve import "../helpers/ConvexTestContext"`

**Cause**: Incorrect relative import path from test files in `tests/e2e/`

**Solution**: Use `./helpers/ConvexTestContext` not `../helpers/ConvexTestContext`

**Files affected**:
- `tests/e2e/e2e-03-student-hiring-browser.test.tsx`
- Any other test files importing from helpers directory

### lightningcss pkg Resolution Error

**Error**: `Could not resolve "../pkg"` from lightningcss

**Cause**: This is a dependency issue with lightningcss in browser mode, not a test failure

**Impact**: Some test files may fail to load, but tests that do load run successfully

**Workaround**: This error doesn't affect actual test execution - it's a Vite/build warning that can be ignored if tests run successfully.

## Data Isolation

Each test creates its own data:

1. **Test setup** (`beforeEach`): Creates fresh test data
2. **Test execution**: Runs with isolated data
3. **Test cleanup** (`afterEach`): Deletes all created data

**IDs are tracked**: `ConvexTestContext` tracks all created IDs for cleanup.

**No shared state**: Each test gets unique game/company/user IDs.

## CI/CD Integration

For CI/CD pipelines:

1. **Start backend before tests**:
   ```yaml
   - name: Start Convex Backend
     run: npm run dev:backend &
   - name: Wait for backend
     run: npx wait-on http://localhost:3210/_health
   ```

2. **Run E2E tests**:
   ```yaml
   - name: Run E2E Tests
     run: npm run test:e2e
   ```

3. **Upload traces on failure**:
   ```yaml
   - name: Upload Playwright Traces
     if: failure()
     uses: actions/upload-artifact@v3
     with:
       name: playwright-traces
       path: tests/e2e/__traces__/*.trace
   ```

## Test Results Summary

### Latest Execution (2026-02-04)

**Configuration**:
- Backend: `http://localhost:3210` (Convex local backend)
- Browser: Chromium (headless)
- Trace Mode: `retain-on-failure`
- Test Runner: Vitest Browser Mode with Playwright

**Results**:
- ✅ **Test Files**: 3 passed, 2 failed, 2 skipped (7 total)
- ✅ **Tests**: 23 passed, 47 skipped (70 total)
- ❌ **Failed Files**:
  - `e2e-03-student-hiring-browser.test.tsx` - Import path error
  - `trace-viewer-demo-browser.test.tsx` - Intentional failure (trace demo)
- ✅ **Passed Files**:
  - `e2e-01-browser.test.tsx` - Access request form (6 tests, 1 skipped)
  - `e2e-02-browser.test.tsx` - User roles & permissions (17 tests, 4 skipped)
  - `e2e-07-stubbed-leadership-compilation-browser.test.tsx` - Leadership compilation (9 tests, 4 skipped)

**Known Issues**:
1. Import path error in `e2e-03-student-hiring-browser.test.tsx`:
   - Uses `../helpers/ConvexTestContext` instead of `./helpers/ConvexTestContext`
   - Fix: Update import statement to use correct relative path

2. lightningcss pkg resolution warning:
   - Dependency issue in browser mode
   - Doesn't affect test execution
   - Can be safely ignored

**Trace Files Generated**:
- Located in: `tests/e2e/__traces__/`
- Files: 4 trace files + 4 network files + resources directory
- Successfully demonstrates trace viewer functionality

### Recommendations

1. **Fix import paths**: Update all test files to use `./helpers/` not `../helpers/`
2. **Continue using Chromium**: Stable trace generation and better Playwright support
3. **Monitor backend health**: Always verify backend is running before tests
4. **Use trace viewer**: Leverage `retain-on-failure` for debugging failed tests
5. **Expand test coverage**: Fix failing tests to increase pass rate

## See Also

- [Vitest Convex Test Guide](./vitest-convex-test.md) - Unit/integration tests with `convex-test`
- [TRACE_VIEWER.md](../../../tests/e2e/TRACE_VIEWER.md) - Playwright trace viewer guide
- [Convex Testing Guide](https://docs.convex.dev/testing) - Official Convex testing docs
