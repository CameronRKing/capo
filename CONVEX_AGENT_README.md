# Convex Agents with Claude Code Provider

This project demonstrates how to use Convex agents with Claude Code as the AI provider, enabling you to run AI-powered agents with local Convex deployments.

## Overview

The setup includes:

- **Convex Agent Component**: Uses `@convex-dev/agent` for agent orchestration
- **Claude Code Provider**: Leverages the AI SDK with `ai-sdk-provider-claude-code` to access Claude through your Claude Code CLI
- **Hello World Function**: A simple demonstration of sending prompts to Claude and receiving responses
- **Chat Function**: An interactive example that maintains conversation context

## Prerequisites

1. **Node.js 18+**: Required for Convex and the AI SDK
2. **Claude Code CLI**: Install globally with `npm install -g @anthropic-ai/claude-code`
3. **Claude Subscription**: Claude Pro or Max subscription (or API key)
4. **Convex Account**: Free account at https://convex.dev

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed:
```bash
npm install @convex-dev/agent ai-sdk-provider-claude-code ai --legacy-peer-deps
```

### 2. Configure Claude Code

Install and authenticate the Claude Code CLI:

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Authenticate with your Claude account
claude-code auth
```

This will open a browser window for authentication. Once authenticated, the provider will use your subscription automatically.

### 3. Configure Convex

Initialize your Convex project:

```bash
npx convex dev
```

This will:
- Prompt you to create or login to your Convex account
- Create or select a project
- Generate the necessary code in `convex/_generated/`
- Start the development server

**Important**: You must run `npx convex dev` at least once before using the agents, as it generates the type definitions and API bindings.

### 4. Generate Component Code

After configuring Convex, the agent component code will be automatically generated. If you need to regenerate it:

```bash
npx convex dev --once
```

## File Structure

```
capo/
├── convex/
│   ├── convex.config.ts          # Convex app configuration with agent component
│   ├── agent.ts                  # Claude Code agent setup
│   ├── agentFunctions.ts         # Agent action functions (helloWorld, chat)
│   └── _generated/               # Auto-generated type definitions
└── test-agent.mjs                # Test script for agent invocation
```

## Usage

### Running the Test Script

After completing the setup:

```bash
node test-agent.mjs "Hello, Claude! Tell me a joke."
```

Or with the default prompt:

```bash
node test-agent.mjs
```

The test script will:
1. Verify Convex is configured
2. Connect to your local Convex deployment
3. Send the prompt to Claude through the agent
4. Display the response and timing information

### Using Convex CLI Directly

You can also invoke the agent functions directly using the Convex CLI:

```bash
# Hello world function
npx convex run agentFunctions helloWorld --prompt "What is the capital of France?"

# Chat function (with thread continuation)
npx convex run agentFunctions chat --message "Tell me more"
```

### Interactive Chat Example

```bash
# Start a conversation
npx convex run agentFunctions chat --message "Hello, I'm learning about Convex agents"

# Continue the conversation (use the threadId from previous response)
npx convex run agentFunctions chat --message "How do they work?" --threadId <thread_id>
```

## Code Examples

### Agent Configuration (`convex/agent.ts`)

```typescript
import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { claudeCode } from "ai-sdk-provider-claude-code";

export const claudeAgent = new Agent(components.agent, {
  name: "Claude Assistant",
  languageModel: claudeCode("sonnet"), // or "opus" for more capable model
  instructions: "You are a helpful AI assistant powered by Claude through Claude Code.",
  maxSteps: 5,
});
```

### Hello World Function (`convex/agentFunctions.ts`)

```typescript
export const helloWorld = action({
  args: {
    prompt: v.string(),
  },
  handler: async (ctx, { prompt }) => {
    const threadId = await claudeAgent.createThread(ctx);
    const result = await claudeAgent.generateText(
      ctx,
      { threadId },
      { prompt }
    );
    return {
      response: result.text,
      threadId: threadId,
    };
  },
});
```

## Customization

### Changing the Model

Edit `convex/agent.ts` to use a different model:

```typescript
languageModel: claudeCode("opus"), // More capable, slower
// or
languageModel: claudeCode("sonnet"), // Balanced performance
```

### Adding Tools

You can add tools to your agent by defining them and including them in the agent configuration:

```typescript
import { openai } from "@ai-sdk/openai";

// Define your tools
const getWeather = {
  description: "Get the weather for a location",
  parameters: z.object({
    location: z.string(),
  }),
  execute: async ({ location }) => {
    // Your tool implementation
    return `Weather in ${location}: Sunny, 72°F`;
  },
};

export const claudeAgent = new Agent(components.agent, {
  name: "Weather Bot",
  languageModel: claudeCode("sonnet"),
  instructions: "You are a weather assistant.",
  tools: { getWeather },
  maxSteps: 5,
});
```

### Customizing Agent Instructions

Modify the `instructions` field in `convex/agent.ts` to change the agent's behavior:

```typescript
instructions: "You are a technical writer specializing in documentation.",
```

## Troubleshooting

### Convex Not Configured

If you see "No CONVEX_DEPLOYMENT set":
```bash
npx convex dev
```

### Claude Code Not Authenticated

If you see authentication errors:
```bash
claude-code auth
```

### Type Errors About `components.agent`

If you see TypeScript errors about `components.agent`:
```bash
npx convex dev --once
```

This will regenerate the component code.

### Claude Code CLI Not Found

If the provider can't find the Claude Code CLI:
```bash
npm install -g @anthropic-ai/claude-code
claude-code auth
```

## Architecture

The setup uses the following architecture:

```
┌─────────────────┐
│  Test Script /  │
│  Convex CLI     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Convex Action  │
│  (helloWorld)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Convex Agent    │
│ Component       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI SDK + Claude │
│ Code Provider   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claude Code CLI │
│ (Authenticated) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claude API      │
│ (via your       │
│  subscription)  │
└─────────────────┘
```

## Next Steps

1. **Explore Tools**: Add custom tools to your agent for more capabilities
2. **Multi-Step Reasoning**: Increase `maxSteps` for complex tasks
3. **Thread Management**: Implement conversation history and context retention
4. **Frontend Integration**: Call your agent functions from a React app using `useMutation`
5. **Streaming**: Implement streaming responses for real-time interactions

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Agents Guide](https://docs.convex.dev/agents/getting-started)
- [AI SDK Documentation](https://sdk.vercel.ai)
- [Claude Code Provider](https://ai-sdk.dev/providers/community-providers/claude-code)
- [Claude Code CLI](https://github.com/anthropics/claude-code)

## License

See LICENSE.txt for details.
