/**
 * @file dashboard-visibility.type.ts
 * @module @stackra/dashboard/core/types
 * @description Visibility scope for a persisted dashboard.
 *
 *   - `private` — only the owner sees the dashboard.
 *   - `shared` — every tenant member with the appropriate permission
 *     sees it, and embed tokens can be issued against it.
 */

/**
 * Visibility scope controlling embed-token issue.
 */
export type DashboardVisibility = "private" | "shared";
