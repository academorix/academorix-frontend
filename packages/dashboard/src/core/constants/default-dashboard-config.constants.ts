/**
 * @file default-dashboard-config.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Canonical default value for
 *   {@link IDashboardModuleOptions}. Applied by `mergeConfig(...)` as
 *   the base layer under every user options object handed to
 *   `DashboardModule.forRoot(...)` / `forRootAsync(...)`. Single source
 *   of truth so both forms produce the exact same merged config.
 */

import type { IDashboardModuleOptions } from "@/core/interfaces/dashboard-module-options.interface";

/**
 * Placeholder owner id used by the playground when no explicit
 * `ownerId` is passed to `forRoot(...)`. Kept as a named constant so
 * tests can assert against it without a string literal.
 */
export const PLAYGROUND_OWNER_ID = "playground-user";

/**
 * Placeholder tenant id used by the playground when no explicit
 * `tenantId` is passed to `forRoot(...)`.
 */
export const PLAYGROUND_TENANT_ID = "playground-tenant";

/**
 * Default dashboard module configuration.
 *
 * Every field mirrors an {@link IDashboardModuleOptions} property.
 * `widgets` / `cohorts` / `templates` default to empty arrays so the
 * module boots even when consumers only want the storage adapter +
 * hooks; the framework's built-in dashboards + templates are seeded
 * regardless via the module lifecycle.
 */
export const DEFAULT_DASHBOARD_CONFIG: IDashboardModuleOptions = {
  storage: {
    ownerId: PLAYGROUND_OWNER_ID,
    tenantId: PLAYGROUND_TENANT_ID,
  },
  widgets: [],
  cohorts: [],
};
