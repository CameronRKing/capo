import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    environmentMatchGlobs: [
      // All tests in convex/ will run in edge-runtime
      ["convex/**", "edge-runtime"],
      // Integration tests run in jsdom
      ["tests/integration/**", "jsdom"],
      // All other tests use jsdom (for React component testing)
      ["**", "jsdom"],
    ],
    include: [
      "convex/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
    ],
    server: {
      deps: {
        inline: ["convex-test", "zod"],
      },
    },
  },
});
