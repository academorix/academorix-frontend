/**
 * @file build-layouts-for-keys.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Compute the widget instances + auto-layout at every
 *   breakpoint for an ordered list of catalogue keys. Runs auto-layout
 *   once per breakpoint so a built-in / template dashboard renders
 *   sensibly at every viewport.
 *
 *   The widget list is identical across breakpoints (a change to
 *   widgets on `lg` mirrors to `md` + `sm`); only the coordinates
 *   change.
 */

import { GRID_COLUMNS } from "@/core/constants/grid-columns.constants";
import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";
import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";
import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { WidgetSpan } from "@/core/types/widget-span.type";

import { autoLayout } from "./auto-layout.util";
import { stableWidgetInstance } from "./stable-widget-instance.util";

/**
 * Build a widget list + per-breakpoint layout arrays from an ordered
 * list of catalogue keys.
 *
 * @param keys - Ordered catalogue keys to materialise.
 * @param ownerId - Synthetic owner id — feeds deterministic widget ids.
 * @param spanFor - Catalogue accessor mapping a widget key to its span.
 * @returns Widget list + per-breakpoint layout arrays.
 */
export function buildLayoutsForKeys(
  keys: readonly string[],
  ownerId: string,
  spanFor: (key: string) => WidgetSpan,
): {
  layouts: Record<DashboardBreakpoint, ILayoutItem[]>;
  widgets: IWidgetInstance[];
} {
  // Compute the widget list ONCE so ids match across breakpoints.
  const widgets = keys.map((key) => stableWidgetInstance(key, ownerId));

  // Layout each breakpoint against its column count. `autoLayout`
  // walks the same key list so the widget ids stay consistent across
  // breakpoints — only the coordinates differ.
  const layoutsAt = (bp: DashboardBreakpoint): ILayoutItem[] =>
    autoLayout(keys, ownerId, spanFor, GRID_COLUMNS[bp]).items;

  return {
    widgets,
    layouts: {
      lg: layoutsAt("lg"),
      md: layoutsAt("md"),
      sm: layoutsAt("sm"),
    },
  };
}
