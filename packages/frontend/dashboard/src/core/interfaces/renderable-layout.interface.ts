/**
 * @file renderable-layout.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Runtime layout data used by the widget grid — merges the
 *   current user's saved layout with the built-in defaults at the
 *   active breakpoint. Handy for the renderer, which reads a compact
 *   map by id.
 */

import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";

import type { ILayoutItem } from "./layout-item.interface";
import type { IWidgetInstance } from "./widget-instance.interface";

/**
 * Aggregated per-breakpoint layout ready for handing to the grid.
 */
export interface IRenderableLayout {
  /** Active breakpoint the layout resolved against. */
  breakpoint: DashboardBreakpoint;

  /** Layout entries at the active breakpoint. */
  items: readonly ILayoutItem[];

  /** Widget instances keyed by id for O(1) lookup during render. */
  widgetsById: Map<string, IWidgetInstance>;
}
