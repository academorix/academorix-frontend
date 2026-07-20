/**
 * @file merge-config.util.ts
 * @module @stackra/scheduler/core/utils
 * @description Single source of truth for merging user-supplied
 *   scheduler options with {@link DEFAULT_SCHEDULER_CONFIG}. Both
 *   `forRoot()` and any future async path route through this helper
 *   so defaults stay consistent.
 */

import type { ISchedulerModuleOptions } from '@/core/interfaces';
import { DEFAULT_SCHEDULER_CONFIG } from '@/core/constants/default-scheduler-config.constant';

/**
 * Merge user options into the default scheduler config.
 *
 * @param options - User-supplied partial configuration.
 * @returns Resolved scheduler configuration with defaults applied.
 */
export function mergeConfig(
  options: Partial<ISchedulerModuleOptions> = {}
): ISchedulerModuleOptions {
  return {
    ...DEFAULT_SCHEDULER_CONFIG,
    ...options,
  } as ISchedulerModuleOptions;
}
