/**
 * Integration tests for static data seeding
 * Tests the populateStaticData mutation with convex-test
 */

import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { RESUMES } from "./services/seedData/resumes";
import { COUNTIES } from "./services/seedData/counties";

test("populateStaticData - inserts all 70 resumes", async () => {
  const t = convexTest(schema);

  // Run the seed mutation
  const result = await t.mutation(api.seed.populateStaticData, {});

  // Verify success
  expect(result.success).toBe(true);
  expect(result.resumesCount).toBe(70);

  // Verify all resumes are in database
  const resumes = await t.query(api.seed.listResumes);
  expect(resumes).toHaveLength(70);

  // Verify resume structure
  const firstResume = resumes.find((r: any) => r.repId === "rep1");
  expect(firstResume).toBeDefined();
  expect(firstResume.name).toBe("Marvin Adams");
  expect(firstResume.gender).toBe("M");
  expect(firstResume.intelligence).toBe(32);
  expect(firstResume.myers_briggs).toBe("ISTP");
});

test("populateStaticData - inserts all 88 counties", async () => {
  const t = convexTest(schema);

  // Run the seed mutation
  const result = await t.mutation(api.seed.populateStaticData, {});

  // Verify success
  expect(result.success).toBe(true);
  expect(result.countiesCount).toBe(88);

  // Verify all counties are in database
  const counties = await t.query(api.seed.listCounties);
  expect(counties).toHaveLength(88);

  // Verify county structure
  const hamilton = counties.find((c: any) => c.id === 1);
  expect(hamilton).toBeDefined();
  expect(hamilton.name).toBe("Hamilton");
  expect(hamilton.state_id).toBe("OH");
  expect(hamilton.population).toBe("822596");
  expect(hamilton.path).toBeDefined();
  expect(hamilton.path.length).toBeGreaterThan(0);
});

test("populateStaticData - does not duplicate existing data", async () => {
  const t = convexTest(schema);

  // Run seed mutation twice
  const result1 = await t.mutation(api.seed.populateStaticData, {});
  expect(result1.success).toBe(true);
  expect(result1.resumesCount).toBe(70);
  expect(result1.countiesCount).toBe(88);

  const result2 = await t.mutation(api.seed.populateStaticData, {});
  expect(result2.success).toBe(false);
  expect(result2.message).toBe("Database already contains seed data");

  // Verify no duplicates
  const resumes = await t.query(api.seed.listResumes);
  const counties = await t.query(api.seed.listCounties);
  expect(resumes).toHaveLength(70);
  expect(counties).toHaveLength(88);
});

test("clearStaticData - removes all seeded data", async () => {
  const t = convexTest(schema);

  // Seed data
  await t.mutation(api.seed.populateStaticData, {});

  // Verify data exists
  const resumesBefore = await t.query(api.seed.listResumes);
  const countiesBefore = await t.query(api.seed.listCounties);
  expect(resumesBefore).toHaveLength(70);
  expect(countiesBefore).toHaveLength(88);

  // Clear data
  const clearResult = await t.mutation(api.seed.clearStaticData, {});
  expect(clearResult.success).toBe(true);
  expect(clearResult.deletedResumes).toBe(70);
  expect(clearResult.deletedCounties).toBe(88);

  // Verify data is cleared
  const resumesAfter = await t.query(api.seed.listResumes);
  const countiesAfter = await t.query(api.seed.listCounties);
  expect(resumesAfter).toHaveLength(0);
  expect(countiesAfter).toHaveLength(0);
});

test("resume data structure - matches schema requirements", async () => {
  const t = convexTest(schema);

  await t.mutation(api.seed.populateStaticData, {});

  const resumes = await t.query(api.seed.listResumes);

  // Verify all resumes have required fields
  for (const resume of resumes) {
    expect(resume.repId).toBeDefined();
    expect(resume.name).toBeDefined();
    expect(resume.gender).toMatch(/^[MF]$/);
    expect(resume.education).toBeDefined();
    expect(resume.experience).toBeDefined();
    expect(resume.intelligence).toBeGreaterThanOrEqual(0);
    expect(resume.myers_briggs).toBeDefined();
    expect(resume.other_info).toBeDefined();
    expect(resume.interview).toBeDefined();
    expect(resume.reference_check).toBeDefined();

    // Verify NO hidden fields
    expect(resume).not.toHaveProperty("effort");
    expect(resume).not.toHaveProperty("sales");
    expect(resume).not.toHaveProperty("leadershipBehaviors");
  }
});

test("county data structure - matches schema requirements", async () => {
  const t = convexTest(schema);

  await t.mutation(api.seed.populateStaticData, {});

  const counties = await t.query(api.seed.listCounties);

  // Verify all counties have required fields
  for (const county of counties) {
    expect(county.id).toBeDefined();
    expect(county.id).toBeGreaterThanOrEqual(1);
    expect(county.id).toBeLessThanOrEqual(88);
    expect(county.name).toBeDefined();
    expect(county.state_id).toBe("OH");
    expect(county.population).toBeDefined();
    expect(county.path).toBeDefined();
    expect(county.path.length).toBeGreaterThan(0);
  }

  // Verify unique IDs
  const ids = counties.map((c: any) => c.id);
  const uniqueIds = new Set(ids);
  expect(uniqueIds.size).toBe(88);
});

test("populateStaticData - data integrity check", async () => {
  const t = convexTest(schema);

  await t.mutation(api.seed.populateStaticData, {});

  const resumes = await t.query(api.seed.listResumes);
  const counties = await t.query(api.seed.listCounties);

  // Verify we have exactly the source data
  expect(resumes).toHaveLength(RESUMES.length);
  expect(counties).toHaveLength(COUNTIES.length);

  // Verify resume IDs match expected format
  const resumeIds = resumes.map((r: any) => r.repId).sort();
  const expectedIds = RESUMES.map(r => r.repId).sort();
  expect(resumeIds).toEqual(expectedIds);

  // Verify county IDs are sequential 1-88
  const countyIds = counties.map((c: any) => c.id).sort((a: number, b: number) => a - b);
  for (let i = 0; i < 88; i++) {
    expect(countyIds[i]).toBe(i + 1);
  }
});

test("createAdmin - creates admin user successfully", async () => {
  const t = convexTest(schema);

  const result = await t.mutation(api.seed.createAdmin, {
    email: "admin@capo.dev",
    name: "Capo Admin",
  });

  expect(result.success).toBe(true);
  expect(result.message).toBe("Admin user created successfully");
  expect(result.admin).toBeDefined();
  expect(result.admin.email).toBe("admin@capo.dev");
  expect(result.admin.name).toBe("Capo Admin");
  expect(result.admin.role).toBe("admin");
  expect(result.isNew).toBe(true);
});

test("createAdmin - prevents duplicate admin creation", async () => {
  const t = convexTest(schema);

  // Create first admin
  const result1 = await t.mutation(api.seed.createAdmin, {
    email: "admin@capo.dev",
    name: "Capo Admin",
  });

  expect(result1.success).toBe(true);

  // Try to create second admin with different email
  const result2 = await t.mutation(api.seed.createAdmin, {
    email: "admin2@capo.dev",
    name: "Second Admin",
  });

  expect(result2.success).toBe(false);
  expect(result2.message).toContain("already exist");
  expect(result2.existingAdmins).toHaveLength(1);
  expect(result2.existingAdmins[0].email).toBe("admin@capo.dev");
});

test("createAdmin - returns existing admin if same email", async () => {
  const t = convexTest(schema);

  // Create admin
  const result1 = await t.mutation(api.seed.createAdmin, {
    email: "admin@capo.dev",
    name: "Capo Admin",
  });

  expect(result1.success).toBe(true);
  expect(result1.isNew).toBe(true);

  // Try to create admin with same email
  const result2 = await t.mutation(api.seed.createAdmin, {
    email: "admin@capo.dev",
    name: "Capo Admin",
  });

  expect(result2.success).toBe(true);
  expect(result2.message).toBe("Admin user already exists");
  expect(result2.isNew).toBe(false);
  expect(result2.admin._id).toBe(result1.admin._id);
});

test("createAdmin - prevents changing role of existing user", async () => {
  const t = convexTest(schema);

  // Create a student user directly in database
  await t.run(async (ctx) => {
    return await ctx.db.insert("users", {
      name: "Student User",
      email: "student@capo.dev",
      role: "student",
      gameId: undefined,
      companyId: undefined,
    });
  });

  // Try to create admin with same email
  const result = await t.mutation(api.seed.createAdmin, {
    email: "student@capo.dev",
    name: "Student User",
  });

  expect(result.success).toBe(false);
  expect(result.message).toContain("already exists with role student");
  expect(result.message).toContain("Cannot change role");
});
