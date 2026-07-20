/**
 * @file widget-cohorts.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Cohort seed used by {@link WidgetCatalogueService} to
 *   populate the picker sidebar. The array is read at service
 *   construction and treated as the seed — feature modules can extend
 *   it via `registerCohort(...)`.
 */

import type { IWidgetCohortEntry } from "@/core/interfaces/widget-cohort-entry.interface";

/**
 * Canonical cohorts shipped by the framework. Ordering is the sidebar
 * render order; new cohorts append.
 */
export const DEFAULT_WIDGET_COHORTS: readonly IWidgetCohortEntry[] = [
  {
    key: "onboarding",
    label: "Onboarding",
    description: "Get-started checklists and empty-state guides.",
    icon: "sparkles",
  },
  {
    key: "numbers",
    label: "Numbers",
    description: "Single-metric KPI cards with sparklines.",
    icon: "square-chart-bar",
  },
  {
    key: "charts",
    label: "Charts",
    description: "Trends, distributions, and time-series.",
    icon: "chart-column",
  },
  {
    key: "calendar",
    label: "Calendar",
    description: "Sessions, matches, and events on a timeline.",
    icon: "clock",
  },
  {
    key: "people",
    label: "People",
    description: "Athletes, coaches, and family activity.",
    icon: "persons",
  },
  {
    key: "money",
    label: "Money",
    description: "Revenue, invoices, and refund watchlists.",
    icon: "circle-dollar",
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "Safeguarding, credentials, and required documents.",
    icon: "shield-check",
  },
];
