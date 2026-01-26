/**
 * Custom ZAI Provider for Vercel AI SDK
 *
 * This provider connects directly to ZAI endpoints, bypassing the Claude Code SDK.
 * It implements the Vercel AI SDK provider interface for use with the Convex Agent framework.
 */

import { createOpenAI } from "@ai-sdk/openai";

/**
 * ZAI provider configuration options
 */
export interface ZAIProviderConfig {
  /**
   * Base URL for the ZAI API
   * @default "https://api.z.ai/api/paas/v4"
   */
  baseURL?: string;

  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * Model identifiers
   */
  models?: {
    /**
     * Fast, cost-effective model (equivalent to haiku)
     * @default "claude-haiku-4-20250514"
     */
      haiku?: string;

    /**
     * Balanced performance model (equivalent to sonnet)
     * @default "claude-sonnet-4-20250514"
     */
      sonnet?: string;

    /**
     * Most capable model (equivalent to opus)
     * @default "claude-opus-4-20250514"
     */
      opus?: string;
  };
}

/**
 * Default ZAI configuration
 *
 * Note: The AI SDK appends /chat/completions to the baseURL
 */
const DEFAULT_CONFIG = {
  baseURL: 'https://api.z.ai/api/paas/v4',
  models: {
    sonnet: "GLM-4.7",
    haiku: "GLM-4.5-air",
    opus: "GLM-4.7"
  },
} as const;

/**
 * Create a ZAI provider instance
 *
 * @example
 * ```ts
 * import { createZAIProvider } from './lib/ai-sdk-provider-zai';
 *
 * const zai = createZAIProvider({
 *   apiKey: process.env.ZAI_API_KEY!,
 * });
 *
 * const model = zai('sonnet');
 * ```
 */
export function createZAIProvider(config: ZAIProviderConfig) {
  const {
    baseURL = DEFAULT_CONFIG.baseURL,
    apiKey,
    models = DEFAULT_CONFIG.models,
  } = config;

  // Create an OpenAI-compatible provider pointing to ZAI
  const provider = createOpenAI({
    baseURL,
    apiKey,
  });

  /**
   * Get a model by name
   */
  return function getModel(
    model: "haiku" | "sonnet" | "opus" = "sonnet"
  ) {
    const modelName = models[model] || DEFAULT_CONFIG.models[model];
    return provider(modelName);
  };
}

/**
 * Convenience function to create a ZAI model directly
 *
 * @example
 * ```ts
 * import { zai } from './lib/ai-sdk-provider-zai';
 *
 * const model = zai('sonnet');
 * ```
 */
export function zai(
  model: "haiku" | "sonnet" | "opus" = "sonnet",
  config?: Partial<ZAIProviderConfig>
) {
  const apiKey = config?.apiKey || process.env.ZAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ZAI API key is required. Set ZAI_API_KEY environment variable or pass it in config."
    );
  }

  const provider = createZAIProvider({ ...config, apiKey });
  return provider(model);
}
