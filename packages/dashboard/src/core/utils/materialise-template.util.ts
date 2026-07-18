/**
 * @file materialise-template.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Compute the auto-layout + widget instances for a
 *   template so the "Create dashboard" flow can materialise the
 *   dashboard document in a single pass.
 */

import type { IDashboardTemplate } from "@/core/interfaces/dashboard-template.interface";
import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";
import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";
import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { WidgetSpan } from "@/core/types/widget-span.type";

import { buildLayoutsForKeys } from "./build-layouts-for-keys.util";

/**
 * Materialise a template into the widget + layout shape a dashboard
 * document expects.
 *
 * @param template - Template descriptor.
 * @param ownerId - Synthetic owner id — feeds deterministic ids.
 * @param spanFor - Catalogue accessor mapping a widget key to its span.
 * @returns Widget instances + per-breakpoint layouts.
 */
export function materialiseTemplate(
  template: IDashboardTemplate,
  ownerId: string,
  spanFor: (key: string) => WidgetSpan,
): {
  widgets: IWidgetInstance[];
  layouts: Record<DashboardBreakpoint, ILayoutItem[]>;
} {
  return buildLayoutsForKeys(template.keys, ownerId, spanFor);
}
