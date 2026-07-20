/**
 * @file normalise-layouts.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Ensure a dashboard document has one layout array per
 *   breakpoint. The editor writes layouts per breakpoint independently
 *   — this guard keeps rendering resilient to partial writes from an
 *   older client that only mutated one breakpoint.
 */

import type { DashboardBreakpoint } from "@/core/types/dashboard-breakpoint.type";
import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";

/**
 * Normalise a partial layouts map into a full three-breakpoint shape.
 * Missing breakpoints resolve to an empty array so the read side never
 * has to reason about undefined slots.
 *
 * @param layouts Partial layouts map.
 * @returns Full breakpoint-keyed layouts record.
 */
export function normaliseLayouts(
  layouts: Partial<Record<DashboardBreakpoint, readonly ILayoutItem[]>> | undefined,
): Record<DashboardBreakpoint, readonly ILayoutItem[]> {
  return {
    lg: layouts?.lg ?? [],
    md: layouts?.md ?? [],
    sm: layouts?.sm ?? [],
  };
}
