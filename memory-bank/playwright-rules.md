# Playwright E2E Testing

**Framework**: Playwright 1.58.1
**Tests**: 211 tests across 15 files
**Config**: `playwright.config.cjs`

## Quick Start

### Running E2E Tests

| Command | Description |
|---------|-------------|
| `npm run test:e2e:playwright` | Run all Playwright E2E tests |
| `npm run test:e2e:playwright -- --list` | List all tests |
| `npm run test:e2e:playwright -- tests/e2e/playwright/auth.spec.ts` | Run specific file |
| `npm run test:e2e:playwright -- --headed` | Run with visible browser |
| `npm run test:e2e:playwright:ui` | Run with interactive UI |
| `npm run test:e2e:playwright:debug` | Run in debug mode |

### Before Running Tests

1. **Start frontend**:
   ```bash
   npm run dev:frontend > /tmp/frontend.log 2>&1 &
   echo $! > /tmp/frontend.pid
   ```

2. **Verify frontend is running**:
   ```bash
   curl -I http://localhost:5173
   # Should return: HTTP/1.1 200 OK
   ```

3. **Run tests**:
   ```bash
   npm run test:e2e:playwright
   ```

4. **Stop frontend when done**:
   ```bash
   kill $(cat /tmp/frontend.pid)
   ```

## Authentication

E2E tests use URL parameter authentication (NOT login forms):

```typescript
// Login as student
await page.goto('/?role=student');

// Login as teacher
await page.goto('/?role=teacher');

// Login as admin
await page.goto('/?role=admin');
```

## Service Architecture

- **Frontend**: http://localhost:5173 (start with `npm run dev:frontend`)
- **Backend**: https://charming-bass-286.convex.cloud (production deployment)
- **Node.js**: Use `/usr/bin/node` (not Bun's wrapper)

## Important Notes

**DO NOT**:
- ❌ Try to start `convex dev` (fails with WebSocket errors)
- ❌ Use Docker for frontend (use `npm run dev:frontend` instead)
- ❌ Use Vitest browser mode for E2E (use Playwright)

**Why Production Backend?**

Local `convex dev` consistently fails with:
```
WebSocket error message: Unexpected server response: 101
WebSocket closed with code 1006
```

Production backend works perfectly for E2E testing.

## Documentation

- **Setup Complete**: `PLAYWRIGHT_SETUP_COMPLETE.md`
- **Quick Reference**: `tests/e2e/playwright/PLAYWRIGHT_QUICK_REFERENCE.md`
- **Detailed Guide**: `tests/e2e/playwright/PLAYWRIGHT_SETUP.md`
- **Service Management**: `SERVICES.md`

## Test Results

As of Feb 2026:
- **Total Tests**: 211
- **Passing**: 56 (26.5%)
- **Failing**: 155 (73.5%)

**Main Failure Categories**:
1. Missing test data (100+ failures)
2. Authentication mismatch (13+ failures)
3. Route/feature issues (6+ failures)

See Track D analysis (issue bd-xmb) for details.
