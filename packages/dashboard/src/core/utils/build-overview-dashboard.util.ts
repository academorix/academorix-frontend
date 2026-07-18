/**
 * @file build-overview-dashboard.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Materialise the built-in Overview dashboard for a user.
 *   The catalogue's `spanFor(key)` resolver is injected so the util
 *   doesn't have to pull in the widget catalogue service.
 */

import { BUILT_IN_OVERVIEW_ID } from "@/core/constants/built-in-dashboards.constants";
import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { WidgetSpan } from "@/core/types/widget-span.type";

import { buildLayoutsForKeys } from "./build-layouts-for-keys.util";

/** Widget catalogue keys the Overview built-in ships with. */
const OVERVIEW_KEYS: readonly string[] = [
  "onboarding-checklist",
  "kpi-strip",
  "chart-revenue-week",
  "chart-athletes-per-sport",
  "agenda-today",
  "list-recent-activity",
];

/**
 * Build the built-in Overview dashboard for a specific user.
 *
 * @param ownerId - Synthetic owner id (playground stub or real user id).
 * @param tenantId - Owning tenant id.
 * @param spanFor - Catalogue accessor mapping a widget key to its
 *   {@link WidgetSpan}. Injected so this util doesn't have to import
 *   the catalogue service directly.
 * @returns A ready-to-render Overview {@link IDashboard}.
 */
export function buildOverviewDashboard(
  ownerId: string,
  tenantId: string,
  spanFor: (key: string) => WidgetSpan,
): IDashboard {
  const layouts = buildLayoutsForKeys(OVERVIEW_KEYS, ownerId, spanFor);

  return {
    id: BUILT_IN_OVERVIEW_ID,
    tenantId,
    ownerId,
    name: "Overview",
    slug: "overview",
    icon: "square-check",
    visibility: "private",
    // Built-ins live in memory. `shareLevel` is a formality that
    // satisfies the required field — grants never apply to built-ins.
    shareLevel: "private",
    isPinned: true,
    isDefault: true,
    isBuiltIn: true,
    layoutMode: "grid",
    density: "cozy",
    layouts: layouts.layouts,
    widgets: layouts.widgets,
    version: 1,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}
