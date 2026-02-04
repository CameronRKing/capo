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
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  // Set root to project root for correct path resolution
  root: path.resolve(__dirname),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
      "@testHelpers": path.resolve(__dirname, "./tests/e2e/helpers"),
      // Stub out lightningcss native module for browser tests
      "lightningcss": path.resolve(__dirname, "./tests/e2e/stubs/lightningcss.ts"),
    },
  },
  test: {
    // Environment variables for tests
    env: {
      // Use local Convex backend for E2E tests
      // This avoids infinite re-render issues from mocking useQuery/useMutation
      VITE_CONVEX_URL: process.env.VITE_CONVEX_URL || "http://localhost:3210",
      // Enable test mode for Convex test helpers
      IS_TEST: "true",
    },
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
      // Playwright trace configuration for debugging
      // Options: 'off' | 'on' | 'on-first-retry' | 'on-all-retries' | 'retain-on-failure'
      // 'retain-on-failure' is recommended for CI/CD (only saves traces for failed tests)
      // 'on' is useful for local debugging (saves traces for all tests)
      trace: {
        mode: 'retain-on-failure',
        // Store all traces in a centralized directory (relative to project root)
        tracesDir: './tests/e2e/__traces__',
      },
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
      // Skip trace viewer demo (has Vite bundling issues, not critical for E2E)
      "tests/e2e/**/trace-viewer-demo*.test.{ts,tsx}",
      // Skip mock-dependent E2E tests - need rewrite as true E2E with real backend
      "tests/e2e/e2e-07-stubbed-leadership-compilation-browser.test.tsx",
      // Skip tests that use convexTest (node mode) instead of browser mode
      "tests/e2e/e2e-04-student-leadership-browser.test.tsx",
      "tests/e2e/e2e-06-stubbed-hiring-compilation-browser.test.tsx",
      // Skip e2e-reports - uses page.goto() which requires dev server with full routing
      "tests/e2e/e2e-reports-browser.test.tsx",
      // Skip e2e-05-admin-access - component test with complex mocking, needs rewrite
      "tests/e2e/e2e-05-admin-access-browser.test.tsx",
    ],
    // Test timeout (E2E tests may need more time)
    testTimeout: 30000,
    hookTimeout: 30000,
    // Server configuration for testing the actual app
    server: {
      // Allow file system access to project directories
      fs: {
        allow: [
          // Allow access to project root
          path.resolve(__dirname),
          // Allow access to node_modules
          path.resolve(__dirname, "node_modules"),
        ],
      },
      // Deps that need to be inlined in browser mode
      deps: {
        inline: [
          // Inline convex for browser mode
          "convex",
          "convex/react",
          "@convex-dev/*",
          // Inline testing libraries for browser mode
          "@testing-library/dom",
          "@testing-library/react",
        ],
        // External deps that can't be bundled (native modules)
        external: [
          "lightningcss",
          "@testing-library/user-event",
        ],
        // Disable optimizer entirely to avoid lightningcss native dependency issues
        optimizer: {
          disabled: true,
        },
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
