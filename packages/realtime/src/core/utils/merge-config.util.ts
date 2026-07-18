/**
 * @file merge-config.util.ts
 * @module @stackra/realtime/core/utils
 * @description Single source of truth for merging user-supplied
 *   realtime options with {@link DEFAULT_REALTIME_CONFIG}. Both
 *   `forRoot()` and `forRootAsync()` route through this helper so
 *   defaults stay consistent.
 */

import type { IRealtimeModuleOptions } from '@/core/interfaces';
import { DEFAULT_REALTIME_CONFIG } from '@/core/constants/default-realtime-config.constant';

/**
 * Merge user options into the default realtime config.
 *
 * @param options - User-supplied partial configuration.
 * @returns Resolved realtime configuration with defaults applied.
 */
export function mergeConfig(options: Partial<IRealtimeModuleOptions>): IRealtimeModuleOptions {
  return {
    ...DEFAULT_REALTIME_CONFIG,
    ...options,
  } as IRealtimeModuleOptions;
}
