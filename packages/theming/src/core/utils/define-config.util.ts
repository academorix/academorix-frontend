/**
 * @file define-config.util.ts
 * @module @stackra/theming/utils
 * @description Identity passthrough utility for type-safe config files.
 */

import type { IThemingModuleOptions } from '../interfaces';

// ============================================================================
// Utility
// ============================================================================

/**
 * Type-safe config helper for theming module options.
 *
 * Identity pass-through that only exists for TypeScript inference
 * and IDE autocompletion in config files.
 *
 * @param config - The theming module options.
 * @returns The same config object, unmodified.
 */
export function defineConfig(config: IThemingModuleOptions): IThemingModuleOptions {
  return config;
}
