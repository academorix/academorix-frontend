/**
 * @file dashboard-share-level.type.ts
 * @module @stackra/dashboard/core/types
 * @description In-app access scope layered on top of
 *   {@link DashboardVisibility}. Governs who sees the dashboard in the
 *   tenant sidebar / palette / listing surfaces. Independent of
 *   embed-token issue (which continues to obey `visibility`).
 */

/**
 * In-app access scope.
 *
 * - `private` — only the owner sees it in-app.
 * - `shared` — every authenticated tenant member sees it.
 * - `role-restricted` — only users matching a share grant see it in-app.
 *   Embed links continue to obey `visibility`.
 */
export type DashboardShareLevel = "private" | "shared" | "role-restricted";
