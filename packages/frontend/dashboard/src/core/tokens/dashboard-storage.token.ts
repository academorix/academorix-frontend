/**
 * @file dashboard-storage.token.ts
 * @module @stackra/dashboard/core/tokens
 * @description DI token binding to the current
 *   {@link IDashboardStorageAdapter} implementation. Consumers `@Inject`
 *   this token rather than the concrete `DashboardStorageService` so
 *   the adapter can be swapped without touching call sites.
 */

/**
 * Symbol token for the active {@link IDashboardStorageAdapter}.
 */
export const DASHBOARD_STORAGE: unique symbol = Symbol.for("@stackra/dashboard/DASHBOARD_STORAGE");
