/**
 * @file widget.catalogue.ts
 * @module modules/dashboard/widgets/widget.catalogue
 *
 * @description
 * The legacy grid-oriented widget catalogue that drives the
 * `WidgetGrid` component (react-grid-layout). Kept in the app because
 * the catalogue is app-specific data — HeroUI-heavy renderers live in
 * `@/components/dashboard/*`, and this file's `defaultLayout` blocks
 * are tuned to those renderers' visual shape.
 *
 * The type shapes now come from `@stackra/dashboard` under their
 * `I`-prefixed names; this file re-exports them under the historical
 * (unprefixed) aliases for consumers that pre-date the package split.
 */

import type { IWidgetDefinition } from "@stackra/dashboard";

/**
 * The full widget catalogue for the legacy overview page. Order
 * matters: the picker renders categories in the order they first
 * appear, and widgets in the order they are defined.
 */
export const widgetCatalogue: readonly IWidgetDefinition[] = [
  // -- Onboarding -----------------------------------------------------------
  {
    key: "onboarding-checklist",
    title: "Setup checklist",
    description: "Track the workspace setup steps every academy needs to run.",
    category: "onboarding",
    sourceResource: "dashboard",
    defaultWidth: 3,
    defaultHeight: 2,
    defaultLayout: { w: 12, h: 2, minW: 6, minH: 2, maxW: 12, maxH: 3 },
    isAvailable: true,
  },

  // -- Numbers (KPIs) -------------------------------------------------------
  {
    key: "kpi-athletes",
    title: "Athletes",
    description: "Total registered athletes in the active scope.",
    category: "numbers",
    sourceResource: "athletes",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-coaches",
    title: "Coaches",
    description: "Total coaches assigned in the active scope.",
    category: "numbers",
    sourceResource: "coaches",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-teams",
    title: "Teams",
    description: "Total teams in the active branch and season.",
    category: "numbers",
    sourceResource: "teams",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-events",
    title: "Events",
    description: "Total events scheduled in the active branch and season.",
    category: "numbers",
    sourceResource: "events",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-active-memberships",
    title: "Active memberships",
    description: "Members currently on an active plan.",
    category: "numbers",
    sourceResource: "memberships",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-open-leads",
    title: "Open leads",
    description: "Leads in the pipeline that have not converted or been lost.",
    category: "numbers",
    sourceResource: "leads",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-active-branches",
    title: "Active branches",
    description: "Branches currently accepting registrations.",
    category: "numbers",
    sourceResource: "branches",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },

  // -- Money ---------------------------------------------------------------
  {
    key: "kpi-revenue-mtd",
    title: "Revenue this month",
    description: "Payments received since the first of the month.",
    category: "money",
    sourceResource: "invoices",
    requiredPermission: "invoices.viewAny",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },
  {
    key: "kpi-outstanding-invoices",
    title: "Outstanding invoices",
    description: "Invoices issued but not yet paid.",
    category: "money",
    sourceResource: "invoices",
    requiredPermission: "invoices.viewAny",
    defaultWidth: 1,
    defaultHeight: 1,
    defaultLayout: { w: 3, h: 1, minW: 2, minH: 1, maxW: 6, maxH: 2 },
    isAvailable: true,
  },

  // -- Calendar -------------------------------------------------------------
  {
    key: "list-upcoming-events",
    title: "Upcoming events",
    description: "The next five events in the active scope.",
    category: "calendar",
    sourceResource: "events",
    defaultWidth: 2,
    defaultHeight: 1,
    defaultLayout: { w: 6, h: 2, minW: 3, minH: 2, maxW: 12, maxH: 4 },
    isAvailable: true,
  },

  // -- People ---------------------------------------------------------------
  {
    key: "list-recent-registrations",
    title: "Recent registrations",
    description: "Athletes registered in the last seven days.",
    category: "people",
    sourceResource: "registrations",
    defaultWidth: 2,
    defaultHeight: 1,
    defaultLayout: { w: 6, h: 2, minW: 3, minH: 2, maxW: 12, maxH: 4 },
    isAvailable: true,
  },
] as const;

/**
 * Fast lookup for the picker and layout resolver.
 */
export const widgetCatalogueByKey: ReadonlyMap<string, IWidgetDefinition> = new Map(
  widgetCatalogue.map((widget) => [widget.key, widget]),
);

/**
 * Default layout for a fresh workspace. Referenced by the overview
 * page when no personal layout has been saved yet.
 */
export const defaultLayoutWidgetKeys: readonly string[] = [
  "onboarding-checklist",
  "kpi-athletes",
  "kpi-coaches",
  "kpi-teams",
  "kpi-events",
  "list-recent-registrations",
  "list-upcoming-events",
];
