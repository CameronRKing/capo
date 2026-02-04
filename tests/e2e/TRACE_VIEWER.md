# Playwright Trace Viewer Guide

## Overview

Vitest Browser Mode with Playwright provider supports generating trace files for debugging E2E tests. Traces capture network requests, console logs, screenshots, and more.

## Configuration

Trace generation is configured in `vitest.config.e2e.mts`:

```typescript
browser: {
  trace: {
    mode: 'retain-on-failure',  // Only save traces for failed tests
    tracesDir: './tests/e2e/__traces__',  // Centralized trace storage
  },
}
```

## Trace Modes

- `'off'` - No tracing (default)
- `'on'` - Trace all tests
- `'retain-on-failure'` - Only save traces for failed tests (recommended for CI)
- `'on-first-retry'` - Trace on first retry
- `'on-all-retries'` - Trace on all retries

## Running Tests with Tracing

### Trace on Failures (Default)

```bash
npm run test:e2e
```

Traces are automatically saved to `tests/e2e/__traces__/` when tests fail.

### Trace All Tests (For Debugging)

```bash
npm run test:e2e:trace
```

This overrides the config and traces all tests, regardless of pass/fail status.

## Viewing Traces

### Command Line

```bash
# View a specific trace
npm run test:e2e:view-trace tests/e2e/__traces__/chromium-my-test-0-0.trace.zip

# Or use npx directly
npx playwright show-trace tests/e2e/__traces__/chromium-my-test-0-0.trace.zip
```

This opens the Playwright Trace Viewer in your default browser.

### Browser Viewer

You can also upload traces to the online viewer:
1. Go to https://trace.playwright.dev
2. Upload the trace `.zip` file

### Command Line Options

```bash
# Serve on specific port (opens in browser)
npx playwright show-trace --port 9321 tests/e2e/__traces__/chromium-my-test-0-0.trace.zip

# Use different browser
npx playwright show-trace --browser firefox tests/e2e/__traces__/chromium-my-test-0-0.trace.zip
```

## What's Inside a Trace?

Each trace file contains:

- **Network Requests** - All HTTP/WebSocket requests with headers, bodies, timings
- **Console Logs** - Browser console output (logs, warnings, errors)
- **Screenshots** - Screenshots taken during test execution
- **Page Actions** - Clicks, typing, navigation events
- **Timeline** - Chronological view of all events
- **DOM Snapshots** - Page state at different points

**Note**: The "Sources" tab is not populated by Vitest (see [Vitest docs](https://vitest.dev/guide/browser/trace-view#limitations)).

## Trace File Naming

Format: `{browser}-{test-name}-{repeat}-{retry}.trace.zip`

Example: `chromium-e2e-01-auth-access-flow-0-0.trace.zip`

- `chromium` - Browser name
- `e2e-01-auth-access-flow` - Test file name
- `0` - Repeat count (for repeated tests)
- `0` - Retry count (for retried tests)

## Finding Traces

```bash
# List all trace files
ls tests/e2e/__traces__/*.trace

# Find most recent traces
ls -lt tests/e2e/__traces__/*.trace | head -5

# Find traces for specific test
ls tests/e2e/__traces__/chromium-e2e-01-*.trace
```

## Debugging Workflow

1. **Test fails** - Trace is automatically saved (with `retain-on-failure` mode)
2. **Locate trace** - Find the trace file in `tests/e2e/__traces__/`
3. **Open viewer** - Run `npm run test:e2e:view-trace <path>`
4. **Investigate** - Use the timeline and console to find the issue
5. **Fix test** - Update the test or application code
6. **Re-run** - Verify the fix

## CI/CD Integration

For CI/CD pipelines, consider:

1. **Upload traces as artifacts** - Save traces from failed tests
2. **Use 'retain-on-failure' mode** - Only save traces for failures
3. **Archive traces** - Keep traces for debugging later

Example GitHub Actions step:

```yaml
- name: Upload Playwright Traces
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-traces
    path: tests/e2e/__traces__/*.trace
```

## Troubleshooting

### No trace files generated

- Check that tests are actually failing (with `retain-on-failure` mode)
- Verify the `tracesDir` path is correct
- Try running with `--browser.trace=on` to trace all tests

### Trace viewer won't open

- Ensure Playwright is installed: `npm install -D playwright`
- Use the full path to the trace file
- Try the online viewer at https://trace.playwright.dev

### Large trace files

- Traces include network request bodies by default
- Consider filtering sensitive data
- Use `retain-on-failure` to reduce disk usage

## Resources

- [Vitest Browser Mode - Trace View](https://vitest.dev/guide/browser/trace-view)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Vitest Config - Playwright](https://vitest.dev/config/browser/playwright)
