/**
 * @file widget.registry.ts
 * @module modules/dashboard/widgets/widget.registry
 *
 * @description
 * Maps widget catalogue keys to their React renderers. Kept separate from the
 * catalogue so the picker can display a widget's metadata (title, description,
 * category) even before its renderer has shipped: the catalogue entry sets
 * `isAvailable: false`, the registry omits the key, and the overview page
 * skips it at render time.
 *
 * Renderers are lazy-loaded so a user whose personal layout only shows two
 * KPIs does not download the code for widgets they do not have. `React.lazy`
 * plays nicely with the widget grid: the grid renders a `Suspense` boundary
 * per cell so one slow widget cannot block the rest of the page.
 */

import { lazy } from "react";

import type { WidgetRenderer } from "@/modules/dashboard/widgets/widget.types";
import type { LazyExoticComponent } from "react";

/**
 * The registered set of renderers, keyed by widget catalogue key. Any key not
 * in this map is treated as unavailable — the overview page renders a small
 * placeholder card so a stale saved layout does not crash the grid.
 *
 * The `onboarding-checklist` widget is deliberately absent. It renders above
 * the grid (in the overview page) as a special widget, not inside the picker,
 * so keeping it out of the registry avoids an ineffective dynamic import.
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
