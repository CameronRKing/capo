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
    },
  },
  test: {
    // Environment variables for tests
    env: {
      VITE_CONVEX_URL: process.env.VITE_CONVEX_URL || "http://127.0.0.1:3210",
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
        ],
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
