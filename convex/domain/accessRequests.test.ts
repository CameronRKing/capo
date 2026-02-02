/**
 * Access Request Integration Tests
 *
 * Tests the complete access request lifecycle:
 * 1. Public users create access requests
 * 2. Admins view pending requests
 * 3. Admins approve requests (with game/company assignment)
 * 4. Admins deny requests
 * 5. Least-populated company selection logic
 * 6. RLS rules enforcement
 */

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

test("access request lifecycle: pending → approved", async () => {
  const t = convexTest(schema);

  // Step 1: Create a game and companies
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "setup",
    });
  });

  const company1Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A1",
    });
  });

  const company2Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A2",
    });
  });

  // Step 2: Public user creates access request
  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "John Doe",
      email: "john@example.com",
      role: "teacher",
    }
  );

  expect(requestId).toBeDefined();

  // Step 3: Verify request is in pending state
  const pendingRequests = await t.query(
    api.domain.accessRequests.listPendingRequests,
    {}
  );

  expect(pendingRequests).toHaveLength(1);
  expect(pendingRequests[0].email).toBe("john@example.com");
  expect(pendingRequests[0].status).toBe("pending");

  // Step 4: Admin approves the request
  const approvalResult = await t.mutation(
    api.domain.accessRequests.approveRequest,
    {
      requestId,
      gameId,
      companyId: undefined, // Teachers don't need company
    }
  );

  expect(approvalResult.gameId).toBe(gameId);
  expect(approvalResult.companyId).toBeUndefined();

  // Step 5: Verify request is approved and no longer in pending
  const updatedRequest = await t.query(api.domain.accessRequests.checkRequestStatus, {
    email: "john@example.com",
  });

  expect(updatedRequest?.status).toBe("approved");

  const pendingAfterApproval = await t.query(
    api.domain.accessRequests.listPendingRequests,
    {}
  );

  expect(pendingAfterApproval).toHaveLength(0);
});

test("access request lifecycle: pending → denied", async () => {
  const t = convexTest(schema);

  // Step 1: Create access request
  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "Jane Smith",
      email: "jane@example.com",
      role: "student",
    }
  );

  // Step 2: Verify request is pending
  const pendingRequests = await t.query(
    api.domain.accessRequests.listPendingRequests,
    {}
  );

  expect(pendingRequests).toHaveLength(1);

  // Step 3: Admin denies the request
  await t.mutation(api.domain.accessRequests.denyRequest, {
    requestId,
  });

  // Step 4: Verify request is denied and no longer in pending
  const requestStatus = await t.query(api.domain.accessRequests.checkRequestStatus, {
    email: "jane@example.com",
  });

  expect(requestStatus?.status).toBe("denied");

  const pendingAfterDenial = await t.query(
    api.domain.accessRequests.listPendingRequests,
    {}
  );

  expect(pendingAfterDenial).toHaveLength(0);
});

test("student approval: auto-assign to least-populated company", async () => {
  const t = convexTest(schema);

  // Step 1: Create game with 3 companies
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  const company1Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A1",
    });
  });

  const company2Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A2",
    });
  });

  const company3Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "B",
      name: "Company B1",
    });
  });

  // Step 2: Add existing students to companies (2 in company1, 1 in company2, 0 in company3)
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Student 1",
      email: "student1@example.com",
      role: "student",
      gameId,
      companyId: company1Id,
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Student 2",
      email: "student2@example.com",
      role: "student",
      gameId,
      companyId: company1Id,
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Student 3",
      email: "student3@example.com",
      role: "student",
      gameId,
      companyId: company2Id,
    });
  });

  // Step 3: Create student access request
  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "New Student",
      email: "newstudent@example.com",
      role: "student",
    }
  );

  // Step 4: Approve without specifying company (should auto-assign to company3 - least populated)
  const approvalResult = await t.mutation(
    api.domain.accessRequests.approveRequest,
    {
      requestId,
      gameId,
      companyId: undefined, // Auto-select least-populated
    }
  );

  expect(approvalResult.companyId).toBe(company3Id);

  // Step 5: Verify the request was updated with the company
  const request = await t.run(async (ctx) => {
    return await ctx.db.get(requestId);
  });

  expect(request?.requestedCompanyId).toBe(company3Id);
});

test("student approval: explicit company assignment", async () => {
  const t = convexTest(schema);

  // Step 1: Create game and company
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  const company1Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A1",
    });
  });

  // Step 2: Create student access request
  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "Student",
      email: "student@example.com",
      role: "student",
    }
  );

  // Step 3: Approve with explicit company assignment
  const approvalResult = await t.mutation(
    api.domain.accessRequests.approveRequest,
    {
      requestId,
      gameId,
      companyId: company1Id, // Explicit assignment
    }
  );

  expect(approvalResult.companyId).toBe(company1Id);
});

test("createAccessRequest: prevent duplicate pending requests", async () => {
  const t = convexTest(schema);

  // Step 1: Create first request
  await t.mutation(api.domain.accessRequests.createAccessRequest, {
    name: "User",
    email: "user@example.com",
    role: "teacher",
  });

  // Step 2: Try to create duplicate request
  await expect(
    t.mutation(api.domain.accessRequests.createAccessRequest, {
      name: "User",
      email: "user@example.com",
      role: "teacher",
    })
  ).rejects.toThrow("already pending approval");
});

test("createAccessRequest: prevent requesting with existing user", async () => {
  const t = convexTest(schema);

  // Step 1: Create an existing user
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Existing User",
      email: "existing@example.com",
      role: "teacher",
      gameId: undefined,
      companyId: undefined,
    });
  });

  // Step 2: Try to create request with same email
  await expect(
    t.mutation(api.domain.accessRequests.createAccessRequest, {
      name: "Existing User",
      email: "existing@example.com",
      role: "teacher",
    })
  ).rejects.toThrow("already exists");
});

test("approveRequest: validate company belongs to game", async () => {
  const t = convexTest(schema);

  // Step 1: Create two games
  const game1Id = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 1",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  const game2Id = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Game 2",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  // Step 2: Create company in game2
  const company2Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId: game2Id,
      industry: "A",
      name: "Company A1",
    });
  });

  // Step 3: Create student request
  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "Student",
      email: "student@example.com",
      role: "student",
    }
  );

  // Step 4: Try to approve with company from different game
  await expect(
    t.mutation(api.domain.accessRequests.approveRequest, {
      requestId,
      gameId: game1Id,
      companyId: company2Id, // Company from game2, but approving for game1
    })
  ).rejects.toThrow("does not belong to the specified game");
});

test("listDirectGrantOptions: returns games with company counts", async () => {
  const t = convexTest(schema);

  // Step 1: Create game and companies
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  const company1Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "A",
      name: "Company A1",
    });
  });

  const company2Id = await t.run(async (ctx) => {
    return await ctx.db.insert("companies", {
      gameId,
      industry: "B",
      name: "Company B1",
    });
  });

  // Step 2: Add users to company1
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Student 1",
      email: "student1@example.com",
      role: "student",
      gameId,
      companyId: company1Id,
    });
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      name: "Student 2",
      email: "student2@example.com",
      role: "student",
      gameId,
      companyId: company1Id,
    });
  });

  // Step 3: Query direct grant options
  const options = await t.query(
    api.domain.accessRequests.listDirectGrantOptions,
    {}
  );

  expect(options.games).toHaveLength(1);
  expect(options.games[0]._id).toBe(gameId);
  expect(options.games[0].companies).toHaveLength(2);

  // Find companies with their user counts
  const company1WithOptions = options.games[0].companies.find(
    (c: any) => c._id === company1Id
  );
  const company2WithOptions = options.games[0].companies.find(
    (c: any) => c._id === company2Id
  );

  expect(company1WithOptions?.userCount).toBe(2);
  expect(company2WithOptions?.userCount).toBe(0);
});

test("approveRequest: cannot approve already approved request", async () => {
  const t = convexTest(schema);

  // Step 1: Create game and request
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "User",
      email: "user@example.com",
      role: "teacher",
    }
  );

  // Step 2: Approve the request
  await t.mutation(api.domain.accessRequests.approveRequest, {
    requestId,
    gameId,
    companyId: undefined,
  });

  // Step 3: Try to approve again
  await expect(
    t.mutation(api.domain.accessRequests.approveRequest, {
      requestId,
      gameId,
      companyId: undefined,
    })
  ).rejects.toThrow("Cannot approve request with status");
});

test("denyRequest: cannot deny already denied request", async () => {
  const t = convexTest(schema);

  // Step 1: Create request
  const requestId = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "User",
      email: "user@example.com",
      role: "teacher",
    }
  );

  // Step 2: Deny the request
  await t.mutation(api.domain.accessRequests.denyRequest, {
    requestId,
  });

  // Step 3: Try to deny again
  await expect(
    t.mutation(api.domain.accessRequests.denyRequest, {
      requestId,
    })
  ).rejects.toThrow("Cannot deny request with status");
});

test("listAllRequests: filter by status", async () => {
  const t = convexTest(schema);

  // Step 1: Create multiple requests with different statuses
  const request1 = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "User 1",
      email: "user1@example.com",
      role: "teacher",
    }
  );

  const request2 = await t.mutation(
    api.domain.accessRequests.createAccessRequest,
    {
      name: "User 2",
      email: "user2@example.com",
      role: "student",
    }
  );

  // Approve request1
  const gameId = await t.run(async (ctx) => {
    return await ctx.db.insert("games", {
      name: "Test Game",
      currentQuarter: 1,
      currentPhase: "hiring",
      length: 4,
      status: "active",
    });
  });

  await t.mutation(api.domain.accessRequests.approveRequest, {
    requestId: request1,
    gameId,
    companyId: undefined,
  });

  // Deny request2
  await t.mutation(api.domain.accessRequests.denyRequest, {
    requestId: request2,
  });

  // Step 2: Query all pending requests
  const pending = await t.query(api.domain.accessRequests.listAllRequests, {
    status: "pending",
  });
  expect(pending).toHaveLength(0);

  // Step 3: Query all approved requests
  const approved = await t.query(api.domain.accessRequests.listAllRequests, {
    status: "approved",
  });
  expect(approved).toHaveLength(1);
  expect(approved[0].email).toBe("user1@example.com");

  // Step 4: Query all denied requests
  const denied = await t.query(api.domain.accessRequests.listAllRequests, {
    status: "denied",
  });
  expect(denied).toHaveLength(1);
  expect(denied[0].email).toBe("user2@example.com");

  // Step 5: Query all requests (no filter)
  const all = await t.query(api.domain.accessRequests.listAllRequests, {});
  expect(all).toHaveLength(2);
});
