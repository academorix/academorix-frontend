/**
 * @file widget.registry.ts
 * @module modules/dashboard/widgets/widget.registry
 *
 * @description
 * Maps legacy grid-catalogue widget keys to their `React.lazy`-loaded
 * renderers. Kept in the app because the renderers themselves are
 * HeroUI-heavy visual components — the `@stackra/dashboard` package
 * ships the headless registry service, but the concrete renderer
 * modules stay app-side.
 */

import { lazy } from "react";

import type { WidgetRenderer } from "@stackra/dashboard";
import type { LazyExoticComponent } from "react";

/**
 * The registered set of renderers, keyed by widget catalogue key.
 * Any key not in this map is treated as unavailable — the overview
 * page renders a small placeholder card so a stale saved layout does
 * not crash the grid.
 */
export const widgetRenderers: ReadonlyMap<string, LazyExoticComponent<WidgetRenderer>> = new Map<
  string,
  LazyExoticComponent<WidgetRenderer>
>([
  ["kpi-athletes", lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-athletes"))],
  ["kpi-coaches", lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-coaches"))],
  ["kpi-teams", lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-teams"))],
  ["kpi-events", lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-events"))],
  [
    "kpi-active-memberships",
    lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-active-memberships")),
  ],
  ["kpi-open-leads", lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-open-leads"))],
  [
    "kpi-active-branches",
    lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-active-branches")),
  ],
  ["kpi-revenue-mtd", lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-revenue-mtd"))],
  [
    "kpi-outstanding-invoices",
    lazy(() => import("@/modules/dashboard/widgets/renderers/kpi-outstanding-invoices")),
  ],
  [
    "list-recent-registrations",
    lazy(() => import("@/modules/dashboard/widgets/renderers/list-recent-registrations")),
  ],
  [
    "list-upcoming-events",
    lazy(() => import("@/modules/dashboard/widgets/renderers/list-upcoming-events")),
  ],
]);
