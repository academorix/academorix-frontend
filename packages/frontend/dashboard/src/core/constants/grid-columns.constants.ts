/**
 * @file grid-columns.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Number of grid columns per breakpoint. Matches
 *   react-grid-layout's defaults so a widget declared `w: 6` on `lg`
 *   renders half-width.
 */

import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";

/**
 * Column count per named breakpoint.
 *
 * - `lg` — 12 columns (desktop viewport).
 * - `md` — 8 columns (tablet viewport).
 * - `sm` — 4 columns (phone viewport).
 */
export const GRID_COLUMNS: Record<DashboardBreakpoint, number> = {
  lg: 12,
  md: 8,
  sm: 4,
};
