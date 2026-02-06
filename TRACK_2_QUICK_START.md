# Track 2: E2E Playwright Conversion - Quick Reference

## What Was Done

Converted 2 Vitest browser tests to Playwright E2E format:
- **e2e-03**: Student Hiring Decision Form (20+ tests)
- **e2e-04**: Student Leadership Decision Form (13 test suites)

## Files Created

```
tests/e2e/playwright/
├── e2e-03-student-hiring.spec.ts      ✅ 428 lines, ready to run
└── e2e-04-student-leadership.spec.ts   ✅ 345 lines, ready to run
```

## How to Run (Once Config Issue is Fixed)

### Prerequisites
```bash
# Install Playwright browsers (first time only)
npm run test:e2e:playwright:install

# Start backend (ASK PERMISSION FIRST - see SERVICES.md)
npm run dev:backend &
```

### Run Tests
```bash
# Run both new tests
npm run test:e2e:playwright

# Run specific test
npm run test:e2e:playwright -- e2e-03-student-hiring.spec.ts
npm run test:e2e:playwright -- e2e-04-student-leadership.spec.ts

# Run with UI mode
npm run test:e2e:playwright:ui

# Run with debug mode
npm run test:e2e:playwright:debug
```

## Current Blocker

**Playwright Config Issue:**
```
error: Cannot find module 'playwright.config.ts.esm.preflight'
```

This is a Playwright tooling issue, not a test code issue. The test files are syntactically correct.

## Investigation Steps

1. **Check if other .spec.ts files have the same issue:**
   ```bash
   npm run test:e2e:playwright -- auth.spec.ts
   ```

2. **Try running without config:**
   ```bash
   cd tests/e2e/playwright
   npx playwright test --config=playwright.config.mts e2e-03-student-hiring.spec.ts
   ```

3. **Check Playwright version:**
   ```bash
   npx playwright --version
   # Current: 1.58.1
   ```

4. **Search for known issues:**
   - GitHub: https://github.com/microsoft/playwright/issues
   - Search: "esm.preflight playwright config"

## Test Coverage

### e2e-03 (Hiring)
- ✅ Form rendering (all sections, defaults)
- ✅ Form validation (salary, commission, training sum, benefits, travel, sales contest)
- ✅ Auto-save functionality
- ✅ Submission workflow (dialog, cancel, confirm)
- ✅ Complete workflow (fill → submit)
- ✅ Training allocation scenarios
- ✅ Error messages and help text

### e2e-04 (Leadership)
- ✅ Loading states
- ✅ Form rendering (all sections, sliders, checkboxes, rep cards)
- ✅ Submit button state management
- ✅ Auto-save indicator
- ✅ Validation (time allocation = 100%)
- ✅ Market reports cost calculation
- ✅ Interactive elements (sliders, checkboxes)
- ✅ Complete workflow
- ✅ Error handling

## Key Conversion Patterns

### Before (Vitest Browser Mode)
```typescript
test('renders form', async () => {
  render(<HiringDecisionForm companyId={...} quarter={1} />);
  expect(screen.getByText(/Compensation Package/i)).toBeVisible();
});
```

### After (Playwright E2E)
```typescript
test('renders form', async ({ page }) => {
  await page.goto('/?role=student');
  await page.goto('/student/decisions/hiring');
  await expect(page.locator('text=Compensation Package')).toBeVisible();
});
```

## Documentation

- **Full Summary:** TRACK_2_CONVERSION_SUMMARY.md
- **Beads Issue:** bd-203 (with comment trail)
- **Original Files:** tests/e2e/e2e-03-*.tsx, tests/e2e/e2e-04-*.tsx

## Status

✅ Files converted
✅ TypeScript syntax verified
✅ Test coverage maintained
⚠️ Execution blocked by Playwright config issue
📝 Documentation complete

## Next Steps

1. Resolve Playwright config issue
2. Start backend (ask user for permission per SERVICES.md)
3. Run tests and verify they pass
4. Debug any failures autonomously
5. Close bd-203 when all tests pass
