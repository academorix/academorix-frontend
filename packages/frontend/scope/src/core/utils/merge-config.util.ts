/**
 * @file merge-config.util.ts
 * @module @stackra/scope/core/utils
 * @description Merge user scope options with defaults.
 */

import type { IScopeModuleOptions } from "../interfaces";
import { DEFAULT_SCOPE_OPTIONS } from "../constants/defaults.constant";

/**
 * Merge partial scope options over {@link DEFAULT_SCOPE_OPTIONS}.
 *
 * @param options - User-supplied partial configuration (without `dataSource`).
 * @returns Fully resolved configuration.
 */
export function mergeConfig(options?: IScopeModuleOptions): IScopeModuleOptions {
  return { ...DEFAULT_SCOPE_OPTIONS, ...options };
}
