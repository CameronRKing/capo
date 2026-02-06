# Playwright Quick Reference

## Fast Commands

```bash
# Run all Playwright tests
npm run test:e2e:playwright

# Run specific test file
npm run test:e2e:playwright -- tests/e2e/playwright/navigation.spec.ts

# Run with UI (interactive mode)
npm run test:e2e:playwright:ui

# Run with debugger
npm run test:e2e:playwright:debug

# Quick verification test
npm run test:e2e:playwright:minimal

# Install/update browsers
npm run test:e2e:playwright:install
```

## Direct Commands (without npm)

```bash
# Using wrapper script
./scripts/run-playwright.sh test

# With full path (manual)
PATH="/usr/bin:/bin:/usr/local/bin" /usr/bin/node ./node_modules/.bin/playwright test
```

## Verification Checklist

✅ Real Node.js: `/usr/bin/node --version` = v18.19.1
✅ Playwright installed: Version 1.58.1
✅ Browsers installed: Chromium 1208, Firefox 1509, WebKit 2248
✅ Wrapper script: `/data/projects/capo/scripts/run-playwright.sh`
✅ Test working: `npm run test:e2e:playwright:minimal` passes

## Troubleshooting

| Symptom | Solution |
|---------|----------|
| "playwright: command not found" | Use wrapper script: `./scripts/run-playwright.sh` |
| Tests fail with module errors | Check `which node` - should be `/usr/bin/node` |
| Browser not installed | Run: `npm run test:e2e:playwright:install` |
| Tests timeout | Check frontend: `npm run docker:ps` |

## Configuration Files

- **Config**: `playwright.config.cjs`
- **Tests**: `tests/e2e/playwright/*.spec.ts`
- **Wrapper**: `scripts/run-playwright.sh`
- **Setup Guide**: `tests/e2e/playwright/PLAYWRIGHT_SETUP.md`

## Environment

- **Node.js**: v18.19.1 (from `/usr/bin/node`)
- **Playwright**: 1.58.1
- **Browsers**: Chromium (default), Firefox, WebKit
- **Base URL**: http://localhost:5173 (override with `BASE_URL`)
- **Test Directory**: `tests/e2e/playwright/`

## Why This Works

The wrapper script (`scripts/run-playwright.sh`) ensures:
1. Uses `/usr/bin/node` (real Node.js, not Bun's shim)
2. Sets clean PATH: `/usr/bin:/bin:/usr/local/bin`
3. Verifies versions before running
4. Passes all arguments through to Playwright

This avoids Bun's interference entirely.
