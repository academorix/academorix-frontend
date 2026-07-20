/**
 * @file merge-config.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Single source of truth for merging user options with
 *   {@link DEFAULT_DASHBOARD_CONFIG}. Both `forRoot` and `forRootAsync`
 *   route through this helper so defaults stay consistent.
 */

import { DEFAULT_DASHBOARD_CONFIG } from "@/core/constants/default-dashboard-config.constants";
import type { IDashboardModuleOptions } from "@/core/interfaces/dashboard-module-options.interface";

/**
 * Merge user options with {@link DEFAULT_DASHBOARD_CONFIG}.
 *
 * The merge shallow-copies the `storage` sub-object so an app that
 * overrides only `ownerId` keeps the default `tenantId`.
 *
 * @param options - User-supplied partial options.
 * @returns Fully-resolved options ready for the module to bind.
 */
export function mergeConfig(options?: Partial<IDashboardModuleOptions>): IDashboardModuleOptions {
  return {
    ...DEFAULT_DASHBOARD_CONFIG,
    ...(options ?? {}),
    storage: {
      ...DEFAULT_DASHBOARD_CONFIG.storage,
      ...(options?.storage ?? {}),
    },
    widgets: options?.widgets ?? DEFAULT_DASHBOARD_CONFIG.widgets,
    cohorts: options?.cohorts ?? DEFAULT_DASHBOARD_CONFIG.cohorts,
  };
}
