/**
 * @file merge-config.util.ts
 * @module @stackra/coordinator/core/utils
 * @description Single source of truth for merging user-supplied
 *   coordinator options with {@link DEFAULT_COORDINATOR_CONFIG}. Both
 *   `forRoot()` and `forRootAsync()` route through this helper so
 *   defaults stay consistent.
 */

import type { ICoordinatorModuleOptions } from "@/core/interfaces";
import { DEFAULT_COORDINATOR_CONFIG } from "@/core/constants/default-coordinator-config.constant";

/**
 * Merge user options into the default coordinator config.
 *
 * @param options - User-supplied partial configuration.
 * @returns Resolved coordinator configuration with defaults applied.
 */
export function mergeConfig(
  options: Partial<ICoordinatorModuleOptions> = {},
): ICoordinatorModuleOptions {
  return {
    ...DEFAULT_COORDINATOR_CONFIG,
    ...options,
  } as ICoordinatorModuleOptions;
}
