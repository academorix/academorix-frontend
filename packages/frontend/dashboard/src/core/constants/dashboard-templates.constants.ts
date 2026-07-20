/**
 * @file dashboard-templates.constants.ts
 * @module @stackra/dashboard/core/constants
 * @description Templates shipped by the framework. The "New dashboard"
 *   dialog renders each option as a card. Feature modules cannot mutate
 *   this list at runtime — templates are a first-class piece of the
 *   framework's UX.
 */

import type { IDashboardTemplate } from "@/core/interfaces/dashboard-template.interface";

/**
 * Built-in templates the "New dashboard" dialog exposes.
 *
 * Ordering is the render order in the picker. New templates append.
 */
export const DASHBOARD_TEMPLATES: readonly IDashboardTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Start empty and add widgets as you go.",
    icon: "square",
    layoutMode: "grid",
    keys: [],
  },
  {
    id: "athletics",
    name: "Athletics overview",
    description: "Athletes, registrations, sessions, and safeguarding at a glance.",
    icon: "person",
    color: "accent",
    layoutMode: "grid",
    keys: [
      "kpi-strip",
      "chart-athletes-per-sport",
      "agenda-today",
      "list-new-athletes",
      "compliance-safeguarding-training",
    ],
  },
  {
    id: "finance",
    name: "Finance overview",
    description: "Revenue, outstanding balance, refunds, and the 30-day forecast.",
    icon: "circle-dollar",
    color: "success",
    layoutMode: "grid",
    keys: [
      "kpi-revenue-mtd",
      "chart-revenue-week",
      "money-outstanding-balance",
      "money-refunds-mtd",
      "money-forecast",
    ],
  },
  {
    id: "coach-board",
    name: "Coach board",
    description: "Today's schedule, birthdays, and recent activity for coaches.",
    icon: "clock",
    layoutMode: "grid",
    keys: ["agenda-today", "list-birthdays", "list-recent-activity", "kpi-athletes"],
  },
];
