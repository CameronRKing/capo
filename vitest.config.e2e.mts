/**
 * Vitest Browser Mode Configuration for E2E Tests
 *
 * This configuration is specifically for end-to-end tests that run
 * in an actual browser using Playwright as the provider.
 *
 * Usage:
 *   - Run E2E tests: `npm run test:e2e`
 *   - Run with UI: `npm run test:e2e:ui`
 */

import { defineConfig } from "vitest/config";

// Use string provider name instead of import (vitest v4 API)
// provider: "playwright"

export default defineConfig({
  test: {
    // Browser mode configuration
    browser: {
      enabled: true,
      name: "chromium",
      provider: playwright,
      headless: true,
      // Optional: Configure Playwright-specific options
      providerOptions: {
        // Launch options for Playwright
        launch: {
          // Run in headless mode by default
          headless: true,
        },
      },
    },
    // Include patterns for E2E tests
    include: ["tests/e2e/**/*.test.{ts,tsx}"],
    // Exclude patterns
    exclude: ["node_modules", "dist", ".idea", ".git", ".cache"],
    // Test timeout (E2E tests may need more time)
    testTimeout: 30000,
    hookTimeout: 30000,
    // Server configuration for testing the actual app
    server: {
      // Ensure deps are properly handled
      deps: {
        inline: ["convex-test", "zod"],
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
