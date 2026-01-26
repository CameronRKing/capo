"use node";

import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { zai } from "../lib/ai-sdk-provider-zai";

/**
 * ZAI Agent for Convex
 *
 * This agent uses ZAI as the provider, which connects directly to ZAI's API
 * bypassing the Claude Code SDK authentication requirements.
 *
 * Setup instructions:
 * 1. Set ZAI_API_KEY environment variable in your .env.local file
 * 2. Configure your ZAI base URL if different from default (optional)
 * 3. Restart your development server
 */
export const claudeAgent = new Agent(components.agent, {
  name: "Claude Assistant",
  languageModel: zai("sonnet"), // or "opus" or "haiku"
  instructions: "You are a helpful AI assistant powered by Claude through ZAI.",
  maxSteps: 5, // Maximum number of reasoning steps
});
