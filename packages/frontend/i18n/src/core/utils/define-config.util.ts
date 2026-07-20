/**
 * @file define-config.util.ts
 * @module @stackra/i18n/core/utils
 * @description Typed identity helper for authoring `i18n.config.ts`.
 */

import type { II18nConfig } from "../interfaces";

/**
 * Type-safe i18n configuration helper — identity pass-through for
 * inference + IDE autocompletion in config files. Merging happens in
 * `mergeConfig` (called by `I18nModule.forRoot`).
 *
 * @param config - i18n module configuration.
 * @returns The same configuration object (identity).
 *
 * @example
 * ```typescript
 * // config/i18n.config.ts
 * import { defineConfig } from '@stackra/i18n';
 *
 * export default defineConfig({
 *   defaultLocale: 'en',
 *   supportedLocales: ['en', 'ar'],
 * });
 * ```
 */
export function defineConfig(config: II18nConfig): II18nConfig {
  return config;
}
