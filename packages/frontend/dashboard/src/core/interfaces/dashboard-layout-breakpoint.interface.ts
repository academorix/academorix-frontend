/**
 * @file dashboard-layout-breakpoint.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Responsive layout descriptor for a single breakpoint in
 *   the legacy {@link IDashboardLayout} shape.
 */

import type { IDashboardLayoutItem } from "./dashboard-layout-item.interface";

/**
 * Layout at a single breakpoint — columns + row height + item list.
 */
export interface IDashboardLayoutBreakpoint {
  /** Number of columns at this breakpoint. */
  columns: number;

  /** Row height in pixels. */
  rowHeight: number;

  /** Ordered layout entries at this breakpoint. */
  items: IDashboardLayoutItem[];
}
