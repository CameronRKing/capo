/**
 * Test file specifically for verifying Playwright trace viewer functionality
 *
 * This test is designed to fail so we can verify that:
 * 1. Trace files are generated in tests/e2e/__traces__/
 * 2. The trace viewer can open and display the trace
 *
 * To test trace viewer:
 * 1. Remove the .skip below
 * 2. Run this test: npm run test:e2e tests/e2e/trace-viewer-demo-browser.test.tsx
 * 3. View the trace: npm run test:e2e:view-trace tests/e2e/__traces__/chromium-trace-viewer-demo-*.trace.zip
 * 4. Or open in browser: https://trace.playwright.dev
 *
 * @see tests/e2e/TRACE_VIEWER.md for more details
 */

import { expect, test } from "@vitest/browser";

test.skip("trace viewer demo - this test will fail", async ({ page }) => {
  // This assertion will always fail, generating a trace file
  expect(true).toBe(false);
});
