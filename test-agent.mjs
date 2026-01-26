#!/usr/bin/env node

/**
 * Test script for Convex Agent with Claude Code
 *
 * This script demonstrates how to invoke the Claude agent through a local Convex deployment.
 * Run this after configuring your Convex project.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ANSI color codes for better output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function main() {
  log("🤖 Claude Code Agent Test Script", "blue");
  log("================================", "blue");
  console.log();

  // Check if convex is configured
  try {
    const convexConfigPath = resolve(".convex/config.json");
    readFileSync(convexConfigPath, "utf-8");
  } catch (error) {
    log("⚠️  Convex not configured!", "yellow");
    log("");
    log("Please follow these steps to set up Convex:", "yellow");
    log("");
    log("1. Create a Convex account:", "yellow");
    log("   npx convex dev", "yellow");
    log("");
    log("   This will prompt you to login or create an account.", "yellow");
    log("");
    log("2. Make sure Claude Code CLI is installed and authenticated:", "yellow");
    log("   npm install -g @anthropic-ai/claude-code", "yellow");
    log("   claude-code auth", "yellow");
    log("");
    log("3. After setup, run this script again:", "yellow");
    log("   node test-agent.mjs", "yellow");
    log("");
    process.exit(1);
  }

  // Get the prompt from command line args or use a default
  const prompt = process.argv[2] || "Hello! Can you tell me a joke?";

  log(`📝 Sending prompt: "${prompt}"`, "green");
  console.log();

  try {
    // Import the Convex client dynamically
    const { ConvexHttpClient } = await import("convex/dist/browser.js");

    // Read the deployment URL from .convex/config.json
    const convexConfig = JSON.parse(
      readFileSync(resolve(".convex/config.json"), "utf-8")
    );
    const deploymentUrl = convexConfig.deploymentUrl;
    log(`🔗 Connecting to: ${deploymentUrl}`, "blue");
    console.log();

    // Create a Convex client
    const client = new ConvexHttpClient(deploymentUrl);

    // Call the helloWorld function
    log("⏳ Waiting for Claude response...", "yellow");
    console.log();

    const startTime = Date.now();
    const result = await client.mutation("agentFunctions.helloWorld", {
      prompt: prompt,
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log(`✅ Response received in ${duration}s!`, "green");
    console.log();
    log("─".repeat(60), "blue");
    log("Claude's Response:", "blue");
    log("─".repeat(60), "blue");
    console.log();
    console.log(result.response);
    console.log();
    log("─".repeat(60), "blue");
    log(`Thread ID: ${result.threadId}`, "blue");
    log("─".repeat(60), "blue");
    console.log();

    log("💡 Tip: You can continue the conversation by saving the thread ID", "yellow");
    log("   and using the 'chat' function:", "yellow");
    log(`   npx convex run agentFunctions chat --message "Tell me another joke" --threadId ${result.threadId}`, "yellow");
    console.log();

  } catch (error) {
    log("❌ Error:", "yellow");
    console.error(error);
    console.log();

    if (error.message.includes("ENOTFOUND")) {
      log("💡 Make sure Convex dev server is running:", "yellow");
      log("   npx convex dev", "yellow");
      console.log();
    }

    process.exit(1);
  }
}

main();
