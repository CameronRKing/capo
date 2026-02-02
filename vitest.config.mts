import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
    },
  },
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
