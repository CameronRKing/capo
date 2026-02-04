/**
 * Test Utilities for E2E Browser Tests
 *
 * Provides mock Convex setup and test helpers to run E2E tests
 * without requiring authentication or deployed backend.
 */

import React, { ReactNode } from "react";
import { vi } from "vitest";

/**
 * Create a mock Convex client for E2E testing
 *
 * In browser mode with mocked useQuery, we don't need a real client.
 * This is a placeholder object that satisfies TypeScript requirements.
 */
export function createTestConvexClient() {
  // Return a mock object - useQuery is already mocked to return null
  return {
    query: vi.fn(),
    mutation: vi.fn(),
    action: vi.fn(),
    subscription: vi.fn(),
  };
}

/**
 * Test provider wrapper with Convex client
 */
export function TestConvexProvider({ children }: { children: ReactNode }) {
  const client = createTestConvexClient();

  return <div>{children}</div>;
}
