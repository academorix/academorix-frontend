/**
 * @file define-config.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Typed identity for authoring a dashboard module
 *   configuration.
 *
 *   Preserves the shape the workspace's legacy config trio expects.
 *   New apps SHOULD prefer `registerAs` from `@stackra/config` and
 *   `DashboardModule.forRootAsync(dashboardConfig.asProvider())`; this
 *   helper is kept as a lightweight authoring alias for consumers
 *   that don't want a config package boot yet.
 */

import type { IDashboardModuleOptions } from "@/core/interfaces/dashboard-module-options.interface";

/**
 * Typed identity — returns its argument unchanged, with TypeScript
 * enforcing the shape.
 *
 * @param config - Dashboard module options.
 * @returns The same object, typed as {@link IDashboardModuleOptions}.
 */
export function defineConfig(config: IDashboardModuleOptions): IDashboardModuleOptions {
  return config;
}
