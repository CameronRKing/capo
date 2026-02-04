import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { RESUMES } from "./services/seedData/resumes";
import { COUNTIES } from "./services/seedData/counties";

/**
 * Query all resumes (for testing)
 */
export const listResumes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("resumes").collect();
  },
});

/**
 * Query all counties (for testing)
 */
export const listCounties = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("counties").collect();
  },
});

/**
 * Seed mutation to populate static data (resumes and counties)
 * Run this once to initialize the database with reference data
 */
export const populateStaticData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingResumes = await ctx.db.query("resumes").collect();
    const existingCounties = await ctx.db.query("counties").collect();

    if (existingResumes.length > 0 || existingCounties.length > 0) {
      return {
        success: false,
        message: "Database already contains seed data",
        resumesCount: existingResumes.length,
        countiesCount: existingCounties.length,
      };
    }

    // Insert resumes
    let resumeCount = 0;
    for (const resume of RESUMES) {
      await ctx.db.insert("resumes", resume);
      resumeCount++;
    }

    // Insert counties
    let countyCount = 0;
    for (const county of COUNTIES) {
      await ctx.db.insert("counties", county);
      countyCount++;
    }

    return {
      success: true,
      message: "Static data populated successfully",
      resumesCount: resumeCount,
      countiesCount: countyCount,
    };
  },
});

/**
 * Clear all static data (for testing/reset purposes)
 * WARNING: This will delete all resumes and counties
 */
export const clearStaticData = mutation({
  args: {},
  handler: async (ctx) => {
    const resumes = await ctx.db.query("resumes").collect();
    const counties = await ctx.db.query("counties").collect();

    let deletedResumes = 0;
    let deletedCounties = 0;

    for (const resume of resumes) {
      await ctx.db.delete(resume._id);
      deletedResumes++;
    }

    for (const county of counties) {
      await ctx.db.delete(county._id);
      deletedCounties++;
    }

    return {
      success: true,
      message: "Static data cleared successfully",
      deletedResumes,
      deletedCounties,
    };
  },
});

/**
 * Create dummy test users for E2E testing
 *
 * TEMPORARY: Simplified auth for E2E tests using ?user={email} query param
 * See bd-2tk for proper Mailgun magic link implementation
 *
 * Creates:
 * - admin@test.com (admin role)
 * - teacher@test.com (teacher role)
 * - student@test.com (student role)
 *
 * Usage: Run this mutation once to seed test users, then access the app with ?user={email}
 */
export const createTestUsers = mutation({
  args: {},
  handler: async (ctx) => {
    // First, create a game for teacher/student assignments
    let gameId: Id<"games"> | undefined;
    try {
      const games = await ctx.db.query("games").collect();
      if (games.length === 0) {
        gameId = await ctx.db.insert("games", {
          name: "Test Game",
          status: "active",
          currentPhase: "hiring",
          currentQuarter: 1,
          length: 4,
        });
      } else {
        gameId = games[0]._id;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create game: ${error instanceof Error ? error.message : String(error)}`,
        results: [],
      };
    }

    // Create companies for students
    let companyId: Id<"companies"> | undefined;
    try {
      const companies = await ctx.db.query("companies").collect();
      if (companies.length === 0) {
        companyId = await ctx.db.insert("companies", {
          name: "Test Company",
          gameId: gameId as Id<"games">,
          industry: "Technology",
        });
      } else {
        companyId = companies[0]._id;
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to create company: ${error instanceof Error ? error.message : String(error)}`,
        results: [],
      };
    }

    const testUsers = [
      {
        email: "admin@test.com",
        name: "Test Admin",
        role: "admin" as const,
        // NO gameId or companyId fields for admin
      },
      {
        email: "teacher@test.com",
        name: "Test Teacher",
        role: "teacher" as const,
        gameId: gameId as Id<"games">,
        // NO companyId field for teacher
      },
      {
        email: "student@test.com",
        name: "Test Student",
        role: "student" as const,
        gameId: gameId as Id<"games">,
        companyId: companyId as Id<"companies">,
      },
    ];

    const results = [];

    for (const testUser of testUsers) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", testUser.email))
        .first();

      if (existing) {
        results.push({ email: testUser.email, status: "exists", user: existing });
        continue;
      }

      // Build user object WITHOUT undefined fields
      const userData: Record<string, any> = {
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      };

      // Only add optional fields if they exist
      if ("gameId" in testUser && testUser.gameId) {
        userData.gameId = testUser.gameId;
      }
      if ("companyId" in testUser && testUser.companyId) {
        userData.companyId = testUser.companyId;
      }

      try {
        const userId = await ctx.db.insert("users", userData);
        const user = await ctx.db.get(userId);
        results.push({ email: testUser.email, status: "created", user });
      } catch (error) {
        results.push({
          email: testUser.email,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      success: true,
      message: "Test users created/verified",
      results,
    };
  },
});

/**
 * Create an admin user for initial deployment setup
 * This bypasses the normal access request workflow for bootstrap purposes
 *
 * SECURITY: This should only be run once per deployment to create the first admin
 * After the first admin exists, they can approve other admin access requests
 *
 * Usage via Convex Dashboard:
 * 1. Go to Functions → seed → createAdmin
 * 2. Run with: { "email": "admin@example.com", "name": "Admin Name" }
 *
 * @param email - Admin email address (will be used for magic link sign-in)
 * @param name - Admin display name
 * @returns Object with success status and created admin user info
 */
export const createAdmin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, { email, name }) => {
    // Check if user with this email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      // If user exists and is already admin, return success with warning
      if (existingUser.role === "admin") {
        return {
          success: true,
          message: "Admin user already exists",
          admin: existingUser,
          isNew: false,
        };
      }

      // If user exists but is not admin, fail (can't promote existing user)
      return {
        success: false,
        message: `User with email ${email} already exists with role ${existingUser.role}. Cannot change role.`,
        admin: null,
        isNew: false,
      };
    }

    // Check if any admins already exist (prevent accidental multiple admin creation)
    const existingAdmins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    if (existingAdmins.length > 0) {
      return {
        success: false,
        message: `${existingAdmins.length} admin(s) already exist. Use the access request workflow for additional admins.`,
        admin: null,
        isNew: false,
        existingAdmins: existingAdmins.map((a) => ({
          email: a.email,
          name: a.name,
        })),
      };
    }

    // Create admin user (without optional fields)
    const adminId = await ctx.db.insert("users", {
      name,
      email,
      role: "admin",
      // gameId and companyId omitted - admins see all games and companies
    });

    const adminUser = await ctx.db.get(adminId);

    return {
      success: true,
      message: "Admin user created successfully",
      admin: adminUser,
      isNew: true,
    };
  },
});
