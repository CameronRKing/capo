/**
 * ConvexTestContext - Test utilities for E2E tests with real Convex backend
 *
 * This utility provides a thin wrapper around ConvexClient for setting up
 * test data and running queries/mutations against a real Convex backend.
 *
 * Usage:
 * ```ts
 * import { ConvexTestContext } from "./helpers/ConvexTestContext";
 *
 * test("my test", async () => {
 *   const convex = await ConvexTestContext.create();
 *   await convex.insert("users", { name: "Test User", email: "test@example.com" });
 *   const users = await convex.query(api.users.list);
 *   await convex.cleanup();
 * });
 * ```
 */

import { ConvexClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { Id, DataModel } from "../../../convex/_generated/dataModel";

export class ConvexTestContext {
  private client: ConvexClient;
  private createdIds: Array<Id<any>> = [];

  private constructor(client: ConvexClient) {
    this.client = client;
  }

  /**
   * Create a new ConvexTestContext connected to the Convex backend
   *
   * Uses VITE_CONVEX_URL from environment or defaults to production deployment.
   *
   * @param url - Convex backend URL (optional, uses VITE_CONVEX_URL or production)
   * @returns ConvexTestContext instance
   */
  static async create(url?: string): Promise<ConvexTestContext> {
    // Use provided URL, or VITE_CONVEX_URL from environment, or production default
    const convexUrl = url || process.env.VITE_CONVEX_URL || "https://charming-bass-286.convex.cloud";

    const client = new ConvexClient(convexUrl, {
      unsavedChangesWarning: false,
    });

    // Wait for connection to be established
    await new Promise((resolve) => setTimeout(resolve, 100));

    return new ConvexTestContext(client);
  }

  /**
   * Insert a document into a table
   *
   * @param table - Table name
   * @param value - Document value
   * @returns Inserted document ID
   */
  async insert<T extends keyof DataModel>(
    table: T,
    value: Omit<DataModel[T], "_id" | "_creationTime">
  ): Promise<Id<T>> {
    const result = await this.client.mutation(api.testHelpers.insert, {
      table: table as string,
      value: value as any,
    });
    this.createdIds.push(result as Id<any>);
    return result as Id<T>;
  }

  /**
   * Query a function
   *
   * @param func - Query function
   * @param args - Query arguments
   * @returns Query result
   */
  async query<Func extends keyof typeof api>(
    func: Func,
    args?: Parameters<typeof api[Func]>[0]
  ): Promise<ReturnType<typeof api[Func]>> {
    return await this.client.query(api[func] as any, args);
  }

  /**
   * Call a mutation
   *
   * @param func - Mutation function (can use string notation like "internal/updateGame")
   * @param args - Mutation arguments
   * @returns Mutation result
   */
  async mutation<Func extends keyof typeof api>(
    func: Func | string,
    args?: any
  ): Promise<any> {
    if (typeof func === "string") {
      return await this.client.mutation(func as any, args);
    }
    return await this.client.mutation(api[func] as any, args);
  }

  /**
   * Get a document by ID
   *
   * @param table - Table name
   * @param id - Document ID
   * @returns Document or null
   */
  async get<T extends keyof DataModel>(
    table: T,
    id: Id<T>
  ): Promise<DataModel[T] | null> {
    const result = await this.client.mutation(api.testHelpers.get, {
      table: table as string,
      id,
    });
    return result as DataModel[T] | null;
  }

  /**
   * Delete all test data created during this test
   *
   * This is called automatically in cleanup() but can be called manually if needed.
   */
  async clearTestData(): Promise<void> {
    for (const id of this.createdIds) {
      try {
        await this.client.mutation(api.testHelpers.erase, { id });
      } catch (error) {
        console.warn(`Failed to delete test data ${id}:`, error);
      }
    }
    this.createdIds = [];
  }

  /**
   * Close the client connection and clean up test data
   *
   * This should be called in afterEach or afterAll hooks.
   */
  async cleanup(): Promise<void> {
    await this.clearTestData();
    // ConvexClient doesn't have a close method, so we just clear references
    (this.client as any) = null;
  }

  /**
   * Get the underlying ConvexClient (for advanced use cases)
   */
  getClient(): ConvexClient {
    return this.client;
  }
}

/**
 * Helper to set up test data for E2E tests
 *
 * This provides similar utilities to the fixtures.ts but works with
 * the real Convex backend instead of convex-test.
 */
export const testDataHelpers = {
  /**
   * Create a test game with companies
   */
  async createGame(
    convex: ConvexTestContext,
    config?: { numCompanies?: number; gameStatus?: "setup" | "active" | "completed" }
  ): Promise<{ gameId: string; companyIds: string[] }> {
    const numCompanies = config?.numCompanies ?? 4;
    const gameStatus = config?.gameStatus ?? "active";

    const gameId = await convex.insert("games", {
      name: `Test Game ${Date.now()}`,
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: gameStatus,
    });

    const industries = ["Technology", "Healthcare", "Finance", "Manufacturing"];
    const companyIds: string[] = [];

    for (let i = 0; i < numCompanies; i++) {
      const companyId = await convex.insert("companies", {
        gameId,
        industry: industries[i % industries.length],
        name: `Company ${String.fromCharCode(65 + i)}`,
      });
      companyIds.push(companyId);
    }

    return { gameId, companyIds };
  },

  /**
   * Create a test user
   */
  async createUser(
    convex: ConvexTestContext,
    data: {
      name: string;
      email: string;
      role: "admin" | "teacher" | "student";
      gameId?: string;
      companyId?: string;
    }
  ): Promise<string> {
    const userId = await convex.insert("users", {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      gameId: data.gameId,
      companyId: data.companyId,
    });
    return userId;
  },

  /**
   * Create a test access request
   */
  async createAccessRequest(
    convex: ConvexTestContext,
    data: {
      name: string;
      email: string;
      role: "teacher" | "student";
      status?: "pending" | "approved";
      gameId?: string;
      companyId?: string;
    }
  ): Promise<string> {
    const requestId = await convex.insert("accessRequests", {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      status: data.status ?? "pending",
      requestedGameId: data.gameId,
      requestedCompanyId: data.companyId,
    });
    return requestId;
  },
};
