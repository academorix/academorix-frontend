/**
 * @file build-analytics-dashboard.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Materialise the built-in Analytics dashboard for a
 *   user. Same shape as {@link buildOverviewDashboard} — different
 *   widget seed.
 */

import { BUILT_IN_ANALYTICS_ID } from "@/core/constants/built-in-dashboards.constants";
import type { IDashboard } from "@/core/interfaces/dashboard.interface";
import type { WidgetSpan } from "@/core/types/widget-span.type";

import { buildLayoutsForKeys } from "./build-layouts-for-keys.util";

/** Widget catalogue keys the Analytics built-in ships with. */
const ANALYTICS_KEYS: readonly string[] = [
  "kpi-strip",
  "chart-revenue-week",
  "chart-athletes-per-sport",
  "kpi-athletes",
  "kpi-revenue-mtd",
  "kpi-attendance-rate",
  "kpi-open-leads",
  "compliance-safeguarding-training",
];

/**
 * Build the built-in Analytics dashboard for a specific user.
 *
 * @param ownerId - Synthetic owner id.
 * @param tenantId - Owning tenant id.
 * @param spanFor - Catalogue accessor mapping a widget key to its span.
 * @returns A ready-to-render Analytics {@link IDashboard}.
 */
export function buildAnalyticsDashboard(
  ownerId: string,
  tenantId: string,
  spanFor: (key: string) => WidgetSpan,
): IDashboard {
  const layouts = buildLayoutsForKeys(ANALYTICS_KEYS, ownerId, spanFor);

  return {
    id: BUILT_IN_ANALYTICS_ID,
    tenantId,
    ownerId,
    name: "Analytics",
    slug: "analytics",
    icon: "chart-column",
    visibility: "private",
    shareLevel: "private",
    isPinned: true,
    isDefault: false,
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
