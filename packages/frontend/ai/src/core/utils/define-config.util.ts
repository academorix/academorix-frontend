/**
 * @file define-config.util.ts
 * @module @stackra/ai/core/utils
 * @description Type-safe configuration builder for the AI module. A typed
 *   identity used to author config in a `config/*.config.ts` file — it
 *   performs no merging. Defaults are applied by `mergeConfig()`.
 */

import type { IAiModuleOptions } from "@stackra/contracts";

/**
 * Type-safe configuration builder for `@stackra/ai`.
 *
 * Authoring only — returns the same object, fully typed. Use `mergeConfig()`
 * to apply {@link DEFAULT_AI_CONFIG} defaults at module setup.
 *
 * @param config - The AI module configuration object.
 * @returns The same config object, fully typed.
 *
 * @example
 * ```typescript
 * // config/ai.config.ts
 * import { defineConfig } from '@stackra/ai';
 *
 * export default defineConfig({
 *   baseUrl: 'https://api.example.com',
 *   authProvider,
 *   context: { debounceMs: 250 },
 * });
 * ```
 */
export function defineConfig(config: IAiModuleOptions): IAiModuleOptions {
  return config;
}
