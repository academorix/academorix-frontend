/**
 * @file widget.catalogue.ts
 * @module modules/dashboard/widgets/widget.catalogue
 *
 * @description
 * The complete inventory of widgets available on the overview page. Every
 * entry conforms to {@link WidgetDefinition}; renderers are registered
 * separately in {@link "@/modules/dashboard/widgets/widget.registry"} so a
 * widget can be listed in the picker before its renderer ships (the picker
 * disables it with a "Coming soon" label when `isAvailable` is `false`).
 *
 * See `DASHBOARD_UX_PLAN.md` §4.5 for the full catalogue and its rationale.
 * Grouping in the picker is driven by `category`; ordering within a category
 * is the array order below.
 */

import type { WidgetDefinition } from "@/modules/dashboard/widgets/widget.types";

/**
 * The full widget catalogue. Order matters: the picker renders categories in
 * the order they first appear, and widgets in the order they are defined.
 */
export const widgetCatalogue: readonly WidgetDefinition[] = [
  // -- Onboarding -----------------------------------------------------------
  {
    key: "onboarding-checklist",
    title: "Setup checklist",
    description: "Track the workspace setup steps every academy needs to run.",
    category: "onboarding",
    sourceResource: "dashboard",
    defaultWidth: 3,
    defaultHeight: 2,
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
    isAvailable: true,
  },
  {
    key: "kpi-refunds-mtd",
    title: "Refunds this month",
    description: "Payments refunded since the first of the month.",
    category: "money",
    sourceResource: "invoices",
    requiredPermission: "invoices.viewAny",
    defaultWidth: 1,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "finance-forecast",
    title: "Cash flow forecast",
    description: "Expected revenue over the next 30 days.",
    category: "money",
    sourceResource: "invoices",
    requiredPermission: "invoices.viewAny",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },

  // -- Charts ---------------------------------------------------------------
  {
    key: "chart-revenue-90d",
    title: "Revenue trend",
    description: "Daily revenue over the last 90 days.",
    category: "charts",
    sourceResource: "invoices",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "chart-registrations-30d",
    title: "Registrations (30 days)",
    description: "New registrations over the last 30 days.",
    category: "charts",
    sourceResource: "registrations",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "chart-attendance-30d",
    title: "Attendance (30 days)",
    description: "Attendance rate over the last 30 days.",
    category: "charts",
    sourceResource: "attendance",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "chart-lead-sources",
    title: "Lead sources",
    description: "Breakdown of leads by acquisition source.",
    category: "charts",
    sourceResource: "leads",
    defaultWidth: 1,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "chart-coach-utilisation",
    title: "Coach utilisation",
    description: "Percentage of coach hours booked this week.",
    category: "charts",
    sourceResource: "coaches",
    defaultWidth: 1,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "chart-membership-retention",
    title: "Membership retention",
    description: "Cohort retention across the last 12 months.",
    category: "charts",
    sourceResource: "memberships",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },

  // -- Calendar -------------------------------------------------------------
  {
    key: "agenda-today",
    title: "Today's schedule",
    description: "Sessions, matches, and events happening today.",
    category: "calendar",
    sourceResource: "events",
    defaultWidth: 2,
    defaultHeight: 2,
    isAvailable: false,
  },
  {
    key: "agenda-week",
    title: "This week",
    description: "Sessions, matches, and events for the next seven days.",
    category: "calendar",
    sourceResource: "events",
    defaultWidth: 3,
    defaultHeight: 2,
    isAvailable: false,
  },
  {
    key: "list-upcoming-events",
    title: "Upcoming events",
    description: "The next five events in the active scope.",
    category: "calendar",
    sourceResource: "events",
    defaultWidth: 2,
    defaultHeight: 1,
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
    isAvailable: true,
  },
  {
    key: "list-recent-athletes",
    title: "New athletes",
    description: "Athletes added in the last 30 days.",
    category: "people",
    sourceResource: "athletes",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "people-birthdays",
    title: "Birthdays this week",
    description: "Athletes and staff with birthdays in the next seven days.",
    category: "people",
    sourceResource: "athletes",
    defaultWidth: 1,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "people-recent-check-ins",
    title: "Recent check-ins",
    description: "Athletes checked in through reception in the last 24 hours.",
    category: "people",
    sourceResource: "attendance",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },

  // -- Compliance -----------------------------------------------------------
  {
    key: "compliance-credentials-expiring",
    title: "Credentials expiring",
    description: "Credentials that expire in the next 60 days.",
    category: "compliance",
    sourceResource: "credentials",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "compliance-safeguarding-open",
    title: "Open safeguarding cases",
    description: "Safeguarding cases that are not yet resolved.",
    category: "compliance",
    sourceResource: "safeguarding",
    requiredPermission: "safeguarding.viewAny",
    defaultWidth: 1,
    defaultHeight: 1,
    isAvailable: false,
  },
  {
    key: "compliance-documents-missing",
    title: "Documents missing",
    description: "Athletes with required documents not yet uploaded.",
    category: "compliance",
    sourceResource: "documents",
    defaultWidth: 2,
    defaultHeight: 1,
    isAvailable: false,
  },
] as const;

/** Fast lookup for the picker and layout resolver. */
export const widgetCatalogueByKey: ReadonlyMap<string, WidgetDefinition> = new Map(
  widgetCatalogue.map((widget) => [widget.key, widget]),
);

/**
 * Default layout for a fresh workspace. Referenced by the overview page when
 * no personal layout has been saved yet. Keeps the first-run experience
 * predictable and permission-safe: every widget listed here is either
 * always-enabled or gated on a permission that most operators hold.
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
