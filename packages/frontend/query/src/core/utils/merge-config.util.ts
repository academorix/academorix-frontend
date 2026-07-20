/**
 * @file merge-config.util.ts
 * @module @stackra/query/core/utils
 * @description Merge user options with query defaults.
 */

import type { QueryModuleOptions } from "../interfaces/query-module-options.interface";
import { DEFAULT_QUERY_CONFIG } from "../constants";

/**
 * Merge partial options over {@link DEFAULT_QUERY_CONFIG}.
 *
 * @param options - User-supplied partial configuration.
 * @returns Fully resolved configuration.
 */
export function mergeConfig(options?: QueryModuleOptions): Required<QueryModuleOptions> {
  return { ...DEFAULT_QUERY_CONFIG, ...options };
}
