import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",
    environmentMatchGlobs: [
      // All tests in convex/ will run in edge-runtime
      ["convex/**", "edge-runtime"],
      // All other tests use jsdom (for React component testing)
      ["**", "jsdom"],
    ],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
  },
});
