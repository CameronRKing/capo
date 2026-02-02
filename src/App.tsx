/**
 * DEPRECATED: App.tsx
 *
 * This file is no longer used. The application now uses TanStack Router
 * for routing, which is configured in /data/projects/capo/src/router.tsx
 * and initialized in /data/projects/capo/src/main.tsx.
 *
 * All routes are now defined in /data/projects/capo/src/routes/
 * using file-based routing with @tanstack/react-router.
 *
 * The root route (/) is now at:
 *   /data/projects/capo/src/routes/__root.tsx
 *
 * This file is kept for reference only and can be deleted.
 */

"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800">
        Convex + React + Claude Code Agent
      </header>
      <main className="p-8 flex flex-col gap-16">
        <h1 className="text-4xl font-bold text-center">
          Convex + React + Claude Code Agent
        </h1>
        <Content />
      </main>
    </>
  );
}

function AgentChat() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const helloWorld = useAction(api.agentFunctions.helloWorld);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await helloWorld({ prompt });
      setResponse(result.response);
    } catch (err: any) {
      setError(err.message || "Failed to get response from Claude");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor="prompt" className="font-semibold">
          Send a message to Claude:
        </label>
        <div className="flex gap-2">
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Claude something..."
            className="flex-1 bg-light dark:bg-dark text-dark dark:text-light rounded-md p-2 border-2 border-slate-200 dark:border-slate-800"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-2 rounded-md font-semibold"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-md p-4">
          <p className="text-red-700 dark:text-red-300 font-semibold">Error:</p>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {response && (
        <div className="bg-green-500/10 border-2 border-green-500/30 rounded-md p-4">
          <p className="text-green-700 dark:text-green-300 font-semibold mb-2">
            Claude's Response:
          </p>
          <p className="text-sm whitespace-pre-wrap">{response}</p>
        </div>
      )}

      {!response && !error && !loading && (
        <div className="bg-slate-200 dark:bg-slate-800 rounded-md p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            💡 Try asking: "Tell me a joke" or "What is the capital of France?"
          </p>
        </div>
      )}
    </div>
  );
}

function Content() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Claude Agent Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">🤖 Claude Code Agent</h2>
        <AgentChat />
      </div>

      <div className="flex flex-col max-w-lg mx-auto w-full">
        <p>
          Edit{" "}
          <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
            convex/agentFunctions.ts
          </code>{" "}
          to change the backend agent functions
        </p>
        <p>
          Edit{" "}
          <code className="text-sm font-bold font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded-md">
            src/App.tsx
          </code>{" "}
          to change the frontend
        </p>
      </div>

      <div className="flex flex-col">
        <p className="text-lg font-bold">Useful resources:</p>
        <div className="flex gap-2">
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Convex docs"
              description="Read comprehensive documentation for all Convex features."
              href="https://docs.convex.dev/home"
            />
            <ResourceCard
              title="Convex Agents"
              description="Learn about Convex agents and AI integration."
              href="https://docs.convex.dev/agents/getting-started"
            />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <ResourceCard
              title="Claude Code Provider"
              description="Learn about the Claude Code AI SDK provider."
              href="https://ai-sdk.dev/providers/community-providers/claude-code"
            />
            <ResourceCard
              title="Templates"
              description="Browse our collection of templates to get started quickly."
              href="https://www.convex.dev/templates"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-2 bg-slate-200 dark:bg-slate-800 p-4 rounded-md h-28 overflow-auto">
      <a href={href} className="text-sm underline hover:no-underline">
        {title}
      </a>
      <p className="text-xs">{description}</p>
    </div>
  );
}
