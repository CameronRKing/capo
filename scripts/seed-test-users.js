#!/usr/bin/env node

/**
 * Seed Test Users Script
 *
 * Creates dummy test users for E2E testing using ?user={email} query param
 *
 * Usage: node scripts/seed-test-users.js
 */

import { ConvexClient } from "convex/browser";

const deploymentUrl = process.env.VITE_CONVEX_URL ?? "https://charming-bass-286.convex.cloud";

async function seedTestUsers() {
  console.log(`Seeding test users to ${deploymentUrl}...`);

  const client = new ConvexClient(deploymentUrl);

  try {
    const result = await client.mutation("seed/createTestUsers", {});

    console.log("✅ Test users seeded successfully!");
    console.log("\nCreated users:");
    for (const r of result.results) {
      console.log(`  - ${r.email} (${r.user?.role}) [${r.status}]`);
    }
    console.log("\nAccess the app with:");
    console.log("  http://localhost:5173/?user=admin@test.com");
    console.log("  http://localhost:5173/?user=teacher@test.com");
    console.log("  http://localhost:5173/?user=student@test.com");
  } catch (error) {
    console.error("❌ Failed to seed test users:", error.message);
    console.error(error);
    process.exit(1);
  }
}

seedTestUsers();
