
@convex_rules.mdc

@.claude/docs/convex/components.md

## Testing

**Documentation**: `.claude/docs/testing/vitest-convex-test.md`

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:once` | Run all tests once |
| `npm run test:once convex/` | Run only Convex tests |
| `npm run test:coverage` | Run with coverage report |
| `npm run test:debug` | Debug with inspector |

**Example**:
```typescript
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

test("example", async () => {
  const t = convexTest(schema);
  await t.mutation(api.myFunctions.addNumber, { value: 42 });
  const result = await t.query(api.myFunctions.listNumbers, { count: 10 });
  expect(result).toMatchObject({ viewer: "Anonymous" });
});
```

@memory-bank/vq-rules.md

To run E2E tests, use `npm run test:e2e`. NEVER EVER EVER try to start a vitest service directly by yourself; **ALWAYS** use `npm run test:e2e` for running E2E tests. Always rely on `vq` for unit && integration tests ONLY; for E2E tests, you MUST USE PLAYWRIGHT DIRECTLY!!!

@memory-bank/playwright-rules.md

@SERVICES.md


## Convex Deployment--YOUR RESPONSIBILITY
Whenever you make a change to the convex backend, you **must** (1) update the integration tests to exercise your change, (2) get all the integration tests passing, && (3) DEPLOY THE CHANGE YOURSELF via `npx convex deploy --typecheck=disable`.

## Convex Seed Data--YOUR RESPONSIBILITY
If you add a data-seeding function that is necessary for your tests to pass, YOU ARE RESPONSIBLE for (1) deploying it to production, (2) running the seed function YOURSELF, and (3) pickup up where you left off with your tests.

NEVER TELL THE USER TO DEPLOY TO CONVEX OR RUN FUNCTIONS FOR YOU!!!! THESE THINGS ARE YOUR RESPONSIBILITY!!!!

## Deleting Files
You **CANNOT** use `rm -rf`. THe `-f` flag WILL BE BLOCKED && CAUSE FAILURE. You must use `rm -r` instead.