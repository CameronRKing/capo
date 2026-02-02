/**
 * Vitest Browser Mode Configuration for E2E Tests
 *
 * This configuration is specifically for end-to-end tests that run
 * in an actual browser using Playwright as the provider.
 *
 * These tests interact with the actual UI and require a running dev server.
 *
 * Usage:
 *   - Start dev server: `npm run dev`
 *   - Run E2E tests: `npm run test:e2e`
 *   - Run with UI: `npm run test:e2e:ui`
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:5173
 *   - Convex backend available
 */

import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  test: {
    // Browser mode configuration
    browser: {
      enabled: true,
      provider: playwright(),  // Note: function call!
      headless: true,
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
    // Include patterns for E2E tests only (not integration tests)
    include: ["tests/e2e/**/*-browser.test.{ts,tsx}"],
    // Exclude integration tests and other patterns
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "tests/integration/**",
    ],
    // Test timeout (E2E tests may need more time)
    testTimeout: 30000,
    hookTimeout: 30000,
    // Server configuration for testing the actual app
    server: {
      // Deps that need to be inlined in browser mode
      deps: {
        inline: [],
      },
    },
    // Coverage (optional, can be enabled separately)
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        "**/*.config.{ts,js}",
        "**/types/**",
      ],
    },
  },
});
