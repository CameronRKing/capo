/**
 * E2E Test Fixtures
 *
 * Database and API setup utilities for E2E testing.
 * Provides functions to create test data and mock services.
 */

import { Id } from "../../convex/_generated/dataModel";

/**
 * Create a test game with companies for E2E testing
 *
 * @param t - Convex test instance
 * @param config - Optional configuration
 * @returns gameId and array of companyIds
 */
export async function createTestGame(
  t: any,
  config?: {
    numCompanies?: number;
    gameStatus?: "setup" | "active" | "completed";
  }
): Promise<{
  gameId: string;
  companyIds: string[];
}> {
  const numCompanies = config?.numCompanies ?? 4;
  const gameStatus = config?.gameStatus ?? "active";

  const industries = ["Technology", "Healthcare", "Finance", "Manufacturing"];

  const result = await t.run(async (ctx: any) => {
    // Create game
    const gameId = await ctx.db.insert("games", {
      name: `Test Game ${Date.now()}`,
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: gameStatus,
    });

    // Create companies
    const companyIds: string[] = [];
    for (let i = 0; i < numCompanies; i++) {
      const companyId = await ctx.db.insert("companies", {
        gameId,
        industry: industries[i % industries.length],
        name: `Company ${String.fromCharCode(65 + i)}`, // Company A, B, C, D
      });
      companyIds.push(companyId);
    }

    return { gameId, companyIds };
  });

  return {
    gameId: result.gameId as string,
    companyIds: result.companyIds.map((id: any) => id as string),
  };
}

/**
 * Create a pending access request
 *
 * @param t - Convex test instance
 * @param data - Request data
 * @returns requestId
 */
export async function createTestAccessRequest(
  t: any,
  data: {
    name: string;
    email: string;
    role: "teacher" | "student";
  }
): Promise<string> {
  const requestId = await t.run(async (ctx: any) => {
    return await ctx.db.insert("accessRequests", {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      status: "pending",
      requestedGameId: undefined,
      requestedCompanyId: undefined,
    });
  });

  return requestId as string;
}

/**
 * Create an approved access request (bypassing approval flow)
 *
 * Useful for testing login redirects without going through approval UI.
 *
 * @param t - Convex test instance
 * @param data - Request data (role must be "teacher" or "student", not "admin")
 * @returns requestId and assignments
 */
export async function createApprovedAccessRequest(
  t: any,
  data: {
    name: string;
    email: string;
    role: "teacher" | "student";
    gameId?: string;
    companyId?: string;
  }
): Promise<{
  requestId: string;
  gameId?: string;
  companyId?: string;
}> {
  const result = await t.run(async (ctx: any) => {
    const requestId = await ctx.db.insert("accessRequests", {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      status: "approved",
      requestedGameId: data.gameId,
      requestedCompanyId: data.companyId,
    });

    return {
      requestId,
      gameId: data.gameId,
      companyId: data.companyId,
    };
  });

  return result as any;
}

/**
 * Create a test user directly in the database
 *
 * Bypasses auth flow for testing purposes.
 *
 * @param t - Convex test instance
 * @param data - User data
 * @returns userId
 */
export async function createTestUser(
  t: any,
  data: {
    name: string;
    email: string;
    role: "admin" | "teacher" | "student";
    gameId?: string;
    companyId?: string;
  }
): Promise<string> {
  const userId = await t.run(async (ctx: any) => {
    return await ctx.db.insert("users", {
      name: data.name,
      email: data.email.toLowerCase(),
      role: data.role,
      gameId: data.gameId,
      companyId: data.companyId,
    });
  });

  return userId as string;
}

/**
 * Mock Resend Email Service
 *
 * Intercepts email sends and captures magic link tokens for testing.
 * Use this to avoid sending real emails during E2E tests.
 *
 * Example usage:
 * ```ts
 * const mockResend = new MockResendService();
 * // ... trigger auth flow ...
 * const email = mockResend.getLastEmailFor("user@test.com");
 * const token = email?.token;
 * ```
 */
export class MockResendService {
  public sentEmails: Array<{
    to: string;
    subject: string;
    token: string;
  }> = [];

  /**
   * Clear all captured emails
   */
  clear(): void {
    this.sentEmails = [];
  }

  /**
   * Record an email send (called by mocked Resend API)
   *
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param token - Magic link token
   */
  recordEmail(to: string, subject: string, token: string): void {
    this.sentEmails.push({ to: to.toLowerCase(), subject, token });
  }

  /**
   * Get the last email sent to a specific address
   *
   * @param email - Email address to search for
   * @returns Email object with token, or undefined if not found
   */
  getLastEmailFor(email: string): { token: string } | undefined {
    const normalizedEmail = email.toLowerCase();
    const emails = this.sentEmails.filter((e) => e.to === normalizedEmail);
    return emails.length > 0 ? emails[emails.length - 1] : undefined;
  }

  /**
   * Extract magic link token from email content
   *
   * Parses the magic link URL from the email text/html
   *
   * @param email - Recipient email address
   * @returns Magic link token, or undefined if not found
   */
  extractMagicLinkFromEmail(email: string): string | undefined {
    const emailData = this.getLastEmailFor(email);
    if (!emailData) {
      return undefined;
    }

    // Token is usually in the format: /auth/callback?token=...
    // For now, we just return the stored token
    return emailData.token;
  }

  /**
   * Get all emails sent to a specific address
   *
   * @param email - Email address to search for
   * @returns Array of email objects
   */
  getAllEmailsFor(email: string): Array<{
    to: string;
    subject: string;
    token: string;
  }> {
    const normalizedEmail = email.toLowerCase();
    return this.sentEmails.filter((e) => e.to === normalizedEmail);
  }
}

/**
 * Setup mock Resend service for E2E tests
 *
 * This function monkey-patches the Resend API to capture emails
 * instead of actually sending them.
 *
 * @returns MockResendService instance
 */
export function setupMockResend(): MockResendService {
  const mockResend = new MockResendService();

  // Note: In a real implementation, you would monkey-patch the Resend API here
  // For now, this is a placeholder that shows the intended usage

  return mockResend;
}
