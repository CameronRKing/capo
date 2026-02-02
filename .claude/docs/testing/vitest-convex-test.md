# Testing Convex Functions with Vitest and convex-test

This project uses **vitest** with **convex-test** for testing Convex backend functions. The `convex-test` library provides a mock implementation of the Convex backend, enabling fast automated testing without needing a real backend deployment.

---

## Installation

Dependencies are already installed:
```bash
npm install --save-dev convex-test vitest @edge-runtime/vm
```

---

## Available Test Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode (re-runs on file changes) |
| `npm run test:once` | Run all tests once and exit |
| `npm run test:once convex/` | Run only Convex tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:debug` | Debug tests with inspector (attach debugger to port 9229) |

---

## Configuration

### vitest.config.mts

The Vitest configuration is set up to use different environments based on test location:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    environmentMatchGlobs: [
      ["convex/**", "edge-runtime"],  // Convex tests use edge-runtime
      ["**", "jsdom"],                // React tests use jsdom
    ],
    server: {
      deps: { inline: ["convex-test"] },
    },
  },
});
```

---

## Writing Tests

### Basic Test Structure

Create a file ending in `.test.ts` in your `convex/` folder:

```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("example test", async () => {
  const t = convexTest(schema);

  // Call mutations
  await t.mutation(api.myFunctions.addNumber, { value: 42 });

  // Call queries
  const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
  expect(result).toMatchObject({ viewer: "Anonymous" });
});
```

---

## Testing Patterns

### 1. Testing Mutations and Queries

```typescript
test("add and retrieve data", async () => {
  const t = convexTest(schema);

  // Add data via mutation
  await t.mutation(api.messages.send, { body: "Hello!", author: "Alice" });
  await t.mutation(api.messages.send, { body: "Hi!", author: "Bob" });

  // Query it back
  const messages = await t.query(api.messages.list);
  expect(messages).toMatchObject([
    { body: "Hello!", author: "Alice" },
    { body: "Hi!", author: "Bob" }
  ]);
});
```

### 2. Direct Database Access with `t.run()`

For direct database operations without calling a function:

```typescript
test("direct database operations", async () => {
  const t = convexTest(schema);

  // Insert directly
  const id = await t.run(async (ctx) => {
    return await ctx.db.insert("tasks", { text: "Write tests" });
  });

  // Query directly
  const task = await t.run(async (ctx) => {
    return await ctx.db.get(id);
  });

  expect(task).toMatchObject({ text: "Write tests" });
});
```

### 3. Testing with Authentication

Mock authenticated users:

```typescript
test("authenticated functions", async () => {
  const t = convexTest(schema);

  // Create user context
  const asAlice = t.withIdentity({ name: "Alice" });
  await asAlice.mutation(api.tasks.create, { text: "Alice's task" });

  // Alice sees her tasks
  const aliceTasks = await asAlice.query(api.tasks.list);
  expect(aliceTasks).toMatchObject([{ text: "Alice's task" }]);

  // Bob doesn't see Alice's tasks
  const asBob = t.withIdentity({ name: "Bob" });
  const bobTasks = await asBob.query(api.tasks.list);
  expect(bobTasks).toEqual([]);
});
```

### 4. Testing Actions

Actions that call third-party APIs or use `fetch`:

```typescript
import { vi } from "vitest";

test("action with mocked fetch", async () => {
  const t = convexTest(schema);

  // Mock global fetch
  vi.stubGlobal("fetch", vi.fn(async () => ({
    text: async () => "Mocked response"
  }) as Response));

  const result = await t.action(api.ai.generate, { prompt: "hello" });
  expect(result).toEqual("Mocked response");

  vi.unstubAllGlobals();
});
```

### 5. Testing Scheduled Functions

Use Vitest's fake timers for scheduled functions:

```typescript
test("scheduled function", async () => {
  vi.useFakeTimers();
  const t = convexTest(schema);

  // Call function that schedules something
  const scheduledId = await t.mutation(
    api.scheduler.scheduleTask,
    { delayMs: 10000 }
  );

  // Advance time
  vi.advanceTimersByTime(10000);
  await t.finishInProgressScheduledFunctions();

  // Assert result
  const status = await t.run(async (ctx) => {
    return await ctx.db.get(scheduledId);
  });
  expect(status).toMatchObject({ state: { kind: "success" } });

  vi.useRealTimers();
});
```

### 6. Asserting Errors

```typescript
test("validation errors", async () => {
  const t = convexTest(schema);

  expect(async () => {
    await t.mutation(api.messages.send, { body: "", author: "Test" });
  }).rejects.toThrowError("Empty message body is not allowed");
});
```

### 7. Testing Internal Functions

Test both public and internal functions:

```typescript
import { internal } from "./_generated/api";

test("internal functions", async () => {
  const t = convexTest(schema);

  await t.mutation(internal.tasks.internalMutation, { value: 1 });
  const result = await t.query(internal.tasks.internalQuery);

  expect(result).toEqual(1);
});
```

---

## The Test Context (`t`)

The `convexTest(schema)` function returns a test context object (conventionally named `t`) with the following methods:

| Method | Description |
|--------|-------------|
| `t.query(fn, args)` | Call a query function |
| `t.mutation(fn, args)` | Call a mutation function |
| `t.action(fn, args)` | Call an action function |
| `t.run(handler)` | Execute code with direct database access |
| `t.withIdentity(identity)` | Create context with mocked auth |
| `t.fetch(path, options)` | Call HTTP actions |
| `t.finishInProgressScheduledFunctions()` | Wait for scheduled functions to complete |
| `t.finishAllScheduledFunctions(advanceFn)` | Complete all scheduled functions recursively |

---

## Important Notes

### Schema is Required

Always pass your schema to `convexTest`:

```typescript
const t = convexTest(schema);  // Correct
const t = convexTest();        // Only if you have no schema
```

### Differences from Real Backend

`convex-test` is a mock implementation and differs from the real Convex backend:

- **Error messages**: Content may differ from production
- **Limits**: Size/time limits are not enforced
- **ID format**: Don't depend on specific ID formats
- **Runtime**: Uses edge-runtime mock, not exact Convex runtime
- **Text search**: Simplified prefix matching, no fuzzy search
- **Vector search**: Returns results by similarity but not efficient indexing
- **Cron jobs**: Not supported, trigger functions manually

### Testing Edge Cases

Always test new code manually - the mock runtime may behave differently than the real Convex runtime for certain built-ins.

---

## Example Test File

See `convex/myFunctions.test.ts` for complete examples:

- Testing mutations and queries
- Empty database state
- Direct database access
- Collection queries

---

## Resources

- [Official convex-test documentation](https://docs.convex.dev/testing/convex-test)
- [Vitest documentation](https://vitest.dev/)
- [Example test suite in convex-test repo](https://github.com/get-convex/convex-test)
