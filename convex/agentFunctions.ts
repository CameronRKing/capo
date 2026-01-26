"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { claudeAgent } from "./agent";

/**
 * Hello World Agent Function
 *
 * This function demonstrates sending a prompt to Claude through the Claude Code provider
 * and receiving a response via a Convex deployment.
 *
 * Usage (once Convex is configured):
 * ```
 * npx convex run agentFunctions helloWorld --prompt "Hello, Claude!"
 * ```
 */
export const helloWorld = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, { prompt }) => {
    // Create a new thread for this conversation
    const thread = await claudeAgent.createThread(ctx);

    // Generate a response from Claude
    try {
       const result = await claudeAgent.generateText(
        ctx,
        { threadId: thread.threadId },
        // @ts-ignore
        { prompt }
      );

      // Return the text response
      return {
        response: result.text,
        threadId: thread.threadId,
      };
    } catch (err) {
      console.warn(err, JSON.stringify(err), err.message);
      throw err;
    }
  
  },
});

/**
 * Simple Chat Function
 *
 * A more interactive example that maintains conversation context.
 */
export const chat = action({
  args: {
    message: v.string(),
    threadId: v.optional(v.string()),
  },
  handler: async (ctx, { message, threadId }) => {
    // Use existing thread or create a new one
    let currentThreadId = threadId;
    if (!currentThreadId) {
      const thread = await claudeAgent.createThread(ctx);
      currentThreadId = thread.threadId;
    }

    // Generate response
    const result = await claudeAgent.generateText(
      ctx,
      { threadId: currentThreadId },
      { prompt: message }
    );

    return {
      response: result.text,
      threadId: currentThreadId,
    };
  },
});
