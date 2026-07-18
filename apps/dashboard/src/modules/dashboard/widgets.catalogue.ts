/**
 * @file widgets.catalogue.ts
 * @module modules/dashboard/widgets.catalogue
 *
 * @description
 * App-side widget catalogue backed by `@stackra/dashboard`'s
 * `WidgetCatalogueService`. The catalogue **data** (the fixed
 * `WIDGET_CATALOGUE` entries) lives here because it's app-specific —
 * the package ships the empty service; this file seeds it with the
 * widgets the app renders through its HeroUI-heavy shims.
 *
 * The historical function API (`findWidget`, `widgetsByCohort`,
 * `registerWidget`, `registerCohort`, `defaultLayout`) is preserved
 * verbatim so existing consumers keep compiling.
 */

import {
  WidgetCatalogueService,
  WidgetCohortRegistry,
  WidgetRegistry,
} from "@stackra/dashboard";
import type {
  IWidgetCohortEntry,
  IWidgetCohortGroup,
  IWidgetEntry,
  WidgetCohort,
  WidgetSpan,
} from "@stackra/dashboard";

/** Legacy type re-exports so consumers keep their existing names. */
export type WidgetEntry = IWidgetEntry;
export type { WidgetCohort, WidgetSpan };

// ── Shared catalogue singleton ────────────────────────────────────

/**
 * App-scoped catalogue singleton. Seeded on module load; feature
 * modules can extend it via `registerCohort(...)` / `registerWidget(...)`.
 *
 * The catalogue orchestrator now depends on two backing registries
 * (widget metadata + cohort). We build them here rather than reaching
 * for DI because this file is the legacy pre-DI seed; when the app
 * fully switches to `DashboardModule.forRoot({ widgets: [...] })` this
 * file can be deleted outright.
 */
const widgetRegistry = new WidgetRegistry();
const cohortRegistry = new WidgetCohortRegistry();
const catalogue = new WidgetCatalogueService(widgetRegistry, cohortRegistry);

// The DI lifecycle isn't running here — we drive `onModuleInit`
// ourselves so the default cohorts seed synchronously.
catalogue.onModuleInit();

// ── Seed the app's widget catalogue ───────────────────────────────

const seedWidgets: readonly IWidgetEntry[] = [
  // ---- Onboarding ----
  {
    key: "onboarding-checklist",
    cohort: "onboarding",
    title: "Setup checklist",
    description: "Guided steps to launch your academy.",
    icon: "square-check",
    span: "full",
    defaultEnabled: true,
  },
  // ---- Numbers (KPIs) ----
  {
    key: "kpi-strip",
    cohort: "numbers",
    title: "Headline KPIs",
    description: "Athletes, revenue MTD, attendance, safeguarding — all four cards.",
    icon: "square-chart-bar",
    span: "full",
    defaultEnabled: true,
  },
  {
    key: "kpi-athletes",
    cohort: "numbers",
    title: "Athletes",
    description: "Total active athletes across every branch.",
    icon: "person",
    span: "third",
  },
  {
    key: "kpi-revenue-mtd",
    cohort: "numbers",
    title: "Revenue MTD",
    description: "Gross revenue this month with weekly trend.",
    icon: "circle-dollar",
    span: "third",
  },
  {
    key: "kpi-attendance-rate",
    cohort: "numbers",
    title: "Attendance rate",
    description: "Attendance rate across the last 7 days.",
    icon: "square-check",
    span: "third",
  },
  {
    key: "kpi-open-leads",
    cohort: "numbers",
    title: "Open leads",
    description: "Leads whose stage is not won or lost.",
    icon: "funnel",
    span: "third",
  },
  // ---- Charts ----
  {
    key: "chart-revenue-week",
    cohort: "charts",
    title: "Revenue this week",
    description: "Gross revenue trend across every branch.",
    icon: "chart-line",
    span: "half",
    defaultEnabled: true,
  },
  {
    key: "chart-athletes-per-sport",
    cohort: "charts",
    title: "Athletes per sport",
    description: "Active registrations bucketed by discipline.",
    icon: "chart-column",
    span: "half",
    defaultEnabled: true,
  },
  // ---- Calendar ----
  {
    key: "agenda-today",
    cohort: "calendar",
    title: "Today's schedule",
    description: "Sessions, matches, and events happening today.",
    icon: "clock",
    span: "third",
    defaultEnabled: true,
  },
  // ---- People ----
  {
    key: "list-recent-activity",
    cohort: "people",
    title: "Recent activity",
    description: "Registrations, payments, attendance across the network.",
    icon: "persons",
    span: "third",
    defaultEnabled: true,
  },
  {
    key: "list-birthdays",
    cohort: "people",
    title: "Birthdays this week",
    description: "Athletes and staff with birthdays coming up.",
    icon: "star",
    span: "third",
  },
  {
    key: "list-new-athletes",
    cohort: "people",
    title: "New athletes",
    description: "Registered in the last 30 days.",
    icon: "person-plus",
    span: "third",
  },
  // ---- Money ----
  {
    key: "money-outstanding-balance",
    cohort: "money",
    title: "Outstanding balance",
    description: "Sum of every unpaid invoice — a watchlist.",
    icon: "receipt",
    span: "third",
  },
  {
    key: "money-refunds-mtd",
    cohort: "money",
    title: "Refunds this month",
    description: "Refunded invoices this month, worth watching.",
    icon: "arrow-uturn-cw-right",
    span: "third",
  },
  {
    key: "money-forecast",
    cohort: "money",
    title: "Cash-flow forecast",
    description: "Scheduled + expected revenue over 30 days.",
    icon: "chart-line",
    span: "third",
  },
  // ---- Compliance ----
  {
    key: "compliance-credentials-expiring",
    cohort: "compliance",
    title: "Credentials expiring",
    description: "Coach and staff credentials due in 60 days.",
    icon: "key",
    span: "third",
  },
  {
    key: "compliance-documents-missing",
    cohort: "compliance",
    title: "Documents missing",
    description: "Required documents not yet uploaded.",
    icon: "folder",
    span: "third",
  },
  {
    key: "compliance-safeguarding-training",
    cohort: "compliance",
    title: "Safeguarding training",
    description: "% of staff current on safeguarding training.",
    icon: "shield-check",
    span: "third",
  },
];

for (const widget of seedWidgets) {
  catalogue.registerWidget(widget);
}

// ── Legacy exports ────────────────────────────────────────────────

/**
 * Snapshot of every registered widget entry. Callers that iterated
 * over the fixed `WIDGET_CATALOGUE` array keep their existing code
 * unchanged — this getter returns the live list from the shared
 * service.
 */
export const WIDGET_CATALOGUE: readonly IWidgetEntry[] = catalogue.listWidgets();

/**
 * Legacy cohort list — snapshot of every registered cohort entry.
 */
export const COHORTS: readonly IWidgetCohortEntry[] = catalogue.listCohorts();

/**
 * Return every registered widget grouped by cohort.
 */
export function widgetsByCohort(): readonly IWidgetCohortGroup[] {
  return catalogue.widgetsByCohort();
}

/**
 * Return the default enabled keys — used when the user has no
 * persisted layout.
 */
export function defaultLayout(): string[] {
  return catalogue.defaultLayout();
}

/**
 * Look up a widget entry by key.
 */
export function findWidget(key: string): IWidgetEntry | undefined {
  return catalogue.findWidget(key);
}

/**
 * Register an additional cohort at runtime. Duplicate keys are a
 * no-op (idempotent) so module manifests can safely declare cohorts
 * multiple times across contribution passes.
 */
export function registerCohort(entry: IWidgetCohortEntry): void {
  catalogue.registerCohort(entry);
}

/**
 * Register an additional widget at runtime. Duplicate keys are a
 * no-op — the first registration wins so hot-reload doesn't
 * multiply entries.
 */
export function registerWidget(entry: IWidgetEntry): void {
  catalogue.registerWidget(entry);
}

/**
 * Exposed for consumers that want the raw catalogue service — e.g.
 * the widget-renderer file which pairs the catalogue lookups with
 * the renderer registry.
 */
export { catalogue as widgetCatalogueService };
