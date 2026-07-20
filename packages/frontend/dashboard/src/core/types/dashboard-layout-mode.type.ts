/**
 * @file dashboard-layout-mode.type.ts
 * @module @stackra/dashboard/core/types
 * @description Layout engine mode for a dashboard.
 */

/**
 * Layout engine mode.
 *
 * - `grid` — react-grid-layout style drag-and-drop grid (default).
 * - `flow` — vertical stack of full-width widgets (report style).
 */
export type DashboardLayoutMode = "grid" | "flow";
