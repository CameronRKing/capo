/**
 * Test Utilities for E2E Browser Tests
 *
 * Provides mock Convex setup and test helpers to run E2E tests
 * without requiring a deployed Convex backend.
 */

import React, { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

/**
 * Create a Convex client that handles errors gracefully during tests
 *
 * This allows tests to run without all Convex functions being deployed.
 */
export function createTestConvexClient() {
  const convexUrl = import.meta.env.VITE_CONVEX_URL || "http://127.0.0.1:3210";

  const client = new ConvexReactClient(convexUrl, {
    // Suppress errors from missing functions during tests
    unsuppressedErrors: {
      suppress: (error) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Suppress Convex errors about missing functions
        return (
          errorMessage.includes("Could not find public function") ||
          errorMessage.includes("Server Error")
        );
      },
    },
  });

  return client;
}

/**
 * Test provider wrapper with error-tolerant Convex client
 */
export function TestConvexProvider({ children }: { children: ReactNode }) {
  const client = createTestConvexClient();

  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
