/**
 * @file dashboard-config.token.ts
 * @module @stackra/dashboard/core/tokens
 * @description DI token binding to the resolved
 *   {@link IDashboardModuleOptions}. Package-internal — consumers who
 *   need the module config inject this alias so the DI graph stays
 *   observable, and the app-facing config surface stays a single
 *   canonical binding.
 */

/**
 * Symbol token for the resolved dashboard module configuration.
 */
export const DASHBOARD_CONFIG: unique symbol = Symbol.for("@stackra/dashboard/DASHBOARD_CONFIG");
