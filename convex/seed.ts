import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
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

    // Create admin user
    const adminId = await ctx.db.insert("users", {
      name,
      email,
      role: "admin",
      gameId: undefined, // Admins see all games
      companyId: undefined, // Admins see all companies
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
