/**
 * @file define-config.util.ts
 * @module @stackra/consent/core/utils
 * @description Typed identity helper for authoring `consent.config.ts`.
 */

import type { IConsentModuleOptions } from "../types";

/**
 * Type-safe consent configuration helper — identity pass-through for
 * inference + IDE autocompletion in config files.
 *
 * @param config - Consent module configuration.
 * @returns The same configuration object (identity).
 *
 * @example
 * ```typescript
 * // config/consent.config.ts
 * import { defineConfig } from '@stackra/consent';
 *
 * export default defineConfig({ categories: [...], storage: 'localStorage' });
 * ```
 */
export function defineConfig(config: IConsentModuleOptions): IConsentModuleOptions {
  return config;
}
