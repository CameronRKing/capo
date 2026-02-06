# Playwright Setup with Real Node.js

## Problem

The system has Bun installed at `/home/ubuntu/.bun/bin/`, which provides a `node` shim that interferes with Playwright. The PATH prioritizes Bun's shim before the real Node.js binary at `/usr/bin/node`.

## Solution

Use a wrapper script that explicitly uses `/usr/bin/node` and sets a clean PATH to avoid Bun interference.

## Verified Working Setup

### 1. Real Node.js Location and Version

```bash
/usr/bin/node --version
# v18.19.1 ✓
```

### 2. Playwright Installation

```bash
# Playwright is installed at:
node_modules/playwright/
node_modules/@playwright/test/

# Version: 1.58.1
```

### 3. Wrapper Script

**Location**: `/data/projects/capo/scripts/run-playwright.sh`

**Purpose**: Ensures Playwright runs with real Node.js by:
1. Setting PATH to `/usr/bin:/bin:/usr/local/bin` (no Bun)
2. Using `/usr/bin/node` directly
3. Verifying Node.js and Playwright versions
4. Executing Playwright with all arguments passed through

### 4. Package.json Scripts

```json
{
  "scripts": {
    "test:e2e:playwright": "./scripts/run-playwright.sh test",
    "test:e2e:playwright:ui": "./scripts/run-playwright.sh test --ui",
    "test:e2e:playwright:debug": "./scripts/run-playwright.sh test --debug",
    "test:e2e:playwright:install": "./scripts/run-playwright.sh install",
    "test:e2e:playwright:minimal": "./scripts/run-playwright.sh test --project=chromium tests/e2e/playwright/minimal.spec.ts"
  }
}
```

## Usage

### Run All Playwright Tests

```bash
npm run test:e2e:playwright
```

### Run Specific Test File

```bash
npm run test:e2e:playwright -- tests/e2e/playwright/navigation.spec.ts
```

### Run with UI Mode

```bash
npm run test:e2e:playwright:ui
```

### Run with Debug Mode

```bash
npm run test:e2e:playwright:debug
```

### Install Playwright Browsers

```bash
npm run test:e2e:playwright:install
```

### Run Minimal Verification Test

```bash
npm run test:e2e:playwright:minimal
```

## Direct Playwright Commands (Advanced)

If you need to run Playwright directly without npm scripts:

```bash
# Set clean PATH and use real Node.js
PATH="/usr/bin:/bin:/usr/local/bin" /usr/bin/node ./node_modules/.bin/playwright test

# Or use the wrapper
./scripts/run-playwright.sh test --project=chromium tests/e2e/playwright/minimal.spec.ts
```

## Verification

### Test that Real Node.js is Being Used

```bash
# The wrapper script will show:
# Using Node.js: v18.19.1 (from /usr/bin/node)
# Using Playwright: Version 1.58.1
```

### Verify Playwright Works

```bash
npm run test:e2e:playwright:minimal
# Should output: ✓ 1 passed
```

## Configuration

**Playwright Config**: `playwright.config.cjs`

```javascript
module.exports = defineConfig({
  testDir: './tests/e2e/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run docker:start:frontend',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## Test Files Location

**Directory**: `tests/e2e/playwright/`

**Example Files**:
- `minimal.spec.ts` - Verification test
- `navigation.spec.ts` - Navigation tests
- `auth.spec.ts` - Authentication tests
- `admin-compilation.spec.ts` - Admin tests

## Common Issues and Solutions

### Issue: "Command not found: playwright"

**Solution**: Always use the wrapper script or full path:
```bash
./scripts/run-playwright.sh test
# or
PATH="/usr/bin:/bin:/usr/local/bin" /usr/bin/node ./node_modules/.bin/playwright test
```

### Issue: Tests fail with "Cannot find module"

**Solution**: Ensure you're using real Node.js, not Bun's shim:
```bash
# Check which node is being used
which node
# Should output: /usr/bin/node
# If it outputs: /home/ubuntu/.bun/bin/node, your PATH is wrong
```

### Issue: Playwright browsers not installed

**Solution**: Install browsers using the wrapper:
```bash
npm run test:e2e:playwright:install
```

## Environment Variables

- `BASE_URL` - Override default base URL (default: `http://localhost:5173`)
- `CI` - Set to `true` for CI mode (different retry/worker behavior)

## Summary

**Key Command**: `npm run test:e2e:playwright`

**Why It Works**:
1. Wrapper script uses `/usr/bin/node` directly
2. Clean PATH prevents Bun shim interference
3. Playwright 1.58.1 verified working with Node.js v18.19.1
4. All tests run in real Chromium browser

**Files Modified**:
- Created `scripts/run-playwright.sh` - wrapper script
- Updated `package.json` - Playwright scripts use wrapper
- Created `tests/e2e/playwright/minimal.spec.ts` - verification test
- Created this documentation
