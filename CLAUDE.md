
@convex_rules.mdc

@.claude/docs/convex/components.md

## Testing

### Unit & Integration Tests (Vitest)

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

### E2E Tests (Playwright)

**Documentation**: `PLAYWRIGHT_SETUP_COMPLETE.md`, `tests/e2e/playwright/PLAYWRIGHT_SETUP.md`

**Important**: Use Playwright for E2E testing (not Vitest browser mode)

| Command | Description |
|---------|-------------|
| `npm run test:e2e:playwright` | Run all Playwright E2E tests |
| `npm run test:e2e:playwright -- --list` | List all tests |
| `npm run test:e2e:playwright -- tests/e2e/playwright/auth.spec.ts` | Run specific file |
| `npm run test:e2e:playwright -- --headed` | Run with visible browser |
| `npm run test:e2e:playwright:ui` | Run with interactive UI |
| `npm run test:e2e:playwright:debug` | Run in debug mode |

**E2E Test Setup**:
- **Tests**: 211 tests across 15 files
- **Config**: `playwright.config.cjs`
- **Frontend**: http://localhost:5173 (start with `npm run dev:frontend`)
- **Backend**: https://charming-bass-286.convex.cloud (production)
- **Node.js**: Use `/usr/bin/node` (not Bun's wrapper)

**Authentication**:
E2E tests use URL parameter authentication:
```typescript
// Login as student
await page.goto('/?role=student');

// Login as teacher
await page.goto('/?role=teacher');

// Login as admin
await page.goto('/?role=admin');
```

**Before Running E2E Tests**:
1. Start frontend: `npm run dev:frontend > /tmp/frontend.log 2>&1 &`
2. Verify running: `curl -I http://localhost:5173`
3. Run tests: `npm run test:e2e:playwright`
4. Stop frontend: `kill $(cat /tmp/frontend.pid)`

**Do NOT**:
- Try to start `convex dev` (fails with WebSocket errors)
- Use Docker for frontend (use `npm run dev:frontend` instead)
- Use Vitest browser mode for E2E (use Playwright)

**See Also**: `SERVICES.md` for service architecture and management

@memory-bank/vq-rules.md

@SERVICES.md
