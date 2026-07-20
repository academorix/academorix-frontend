/**
 * @file merge-config.util.ts
 * @module @stackra/storage/core/utils
 * @description Single source of truth for merging user-supplied
 *   storage options with `DEFAULT_STORAGE_CONFIG`. Both `forRoot`
 *   and `forRootAsync` route through this helper so defaults stay
 *   consistent.
 */

import type { IStorageConfig, IStorageModuleOptions } from "@stackra/contracts";

import { DEFAULT_STORAGE_CONFIG } from "@/core/constants/default-storage-config.constant";

/**
 * Merge user options into `DEFAULT_STORAGE_CONFIG` and return the
 * fully-resolved `IStorageConfig`.
 *
 * The `stores` map is merged shallowly: user-supplied entries
 * completely REPLACE default entries with the same name. Anything the
 * user does not touch stays as declared in `DEFAULT_STORAGE_CONFIG`
 * (so the `memory` fallback is always available unless the caller
 * explicitly omits it).
 *
 * @param options - Partial user options (may be omitted entirely).
 * @returns Fully-resolved config with defaults applied.
 */
export function mergeConfig(options?: IStorageModuleOptions): IStorageConfig {
  return {
    default: options?.default ?? DEFAULT_STORAGE_CONFIG.default,
    stores: {
      ...DEFAULT_STORAGE_CONFIG.stores,
      ...(options?.stores ?? {}),
    },
  };
}
