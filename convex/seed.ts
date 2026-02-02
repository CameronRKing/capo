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
