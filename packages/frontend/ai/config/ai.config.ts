/**
 * @file ai.config.ts
 * @module @stackra/ai/config
 * @description Documented sample AI configuration authored with
 *   `defineConfig`. Copy into your app's `src/config/` and pass to
 *   `AiModule.forRoot()`. This is an illustrative stub, not a runtime
 *   default — defaults live in `DEFAULT_AI_CONFIG` and are applied by
 *   `mergeConfig()`. Only `baseUrl` and `authProvider` are required; every
 *   other field falls back to the package defaults when omitted.
 */

import type { IAiCredentials } from "@stackra/contracts";
import { defineConfig } from "@stackra/ai";

/**
 * A placeholder auth provider used purely to make this sample type-check.
 * Replace it with your app's credentials provider (bearer token + headers).
 */
const sampleAuthProvider = {
  getCredentials(): Promise<IAiCredentials> {
    return Promise.resolve({ headers: {} });
  },
  refresh(): Promise<IAiCredentials> {
    return Promise.resolve({ headers: {} });
  },
};

/**
 * Sample authored config.
 */
export const sampleAiConfig = defineConfig({
  baseUrl: "https://api.example.com",
  authProvider: sampleAuthProvider,
  context: {
    debounceMs: 500,
    leaderGated: true,
  },
});

export default sampleAiConfig;
