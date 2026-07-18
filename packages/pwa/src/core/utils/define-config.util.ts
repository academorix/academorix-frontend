/**
 * @file define-config.util.ts
 * @module @stackra/pwa/core/utils
 * @description Typed identity helper for authoring `pwa.config.ts`.
 */

import type { IPwaModuleOptions } from '../interfaces';

/**
 * Type-safe PWA configuration helper — identity pass-through for
 * inference + IDE autocompletion.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@stackra/pwa';
 *
 * export const pwaConfig = defineConfig({
 *   install: { delayMs: 15_000 },
 *   offlineQueue: { enabled: true, storage: 'localStorage' },
 * });
 * ```
 *
 * @param config - Partial PWA module options.
 * @returns The same object, typed as `IPwaModuleOptions`.
 */
export function defineConfig(config: IPwaModuleOptions): IPwaModuleOptions {
  return config;
}
