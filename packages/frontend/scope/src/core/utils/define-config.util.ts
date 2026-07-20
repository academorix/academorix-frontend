/**
 * @file define-config.util.ts
 * @module @stackra/scope/core/utils
 * @description Typed identity helper for authoring `scope.config.ts`.
 */

import type { IScopeModuleOptions } from "../interfaces";

/**
 * Type-safe scope configuration helper — identity pass-through for
 * inference + IDE autocompletion.
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@stackra/scope';
 *
 * export const scopeConfig = defineConfig({ cache: { enabled: true, ttl: 300 } });
 * ```
 */
export function defineConfig(config: IScopeModuleOptions): IScopeModuleOptions {
  return config;
}
