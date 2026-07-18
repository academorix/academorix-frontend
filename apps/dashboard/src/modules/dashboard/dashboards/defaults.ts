/**
 * @file defaults.ts
 * @module modules/dashboard/dashboards/defaults
 *
 * @description
 * Built-in dashboards + template seeds.
 *
 * Two dashboards are always visible regardless of what the user
 * persists:
 *
 *   * **Overview** — the everyday landing surface. Widgets cover the
 *     most-used KPIs, today's schedule, and the onboarding checklist.
 *   * **Analytics** — a chart-heavy variant scoped at running the
 *     same widget catalogue against longer time windows.
 *
 * Built-ins are synthesised in-memory rather than seeded into
 * `localStorage` so a shipped-widget-catalogue change lands
 * automatically without a data migration.
 *
 * Templates are recipes a user can pick when creating a new custom
 * dashboard. Each template seeds an initial layout + widget set —
 * the user then owns the dashboard and can edit freely.
 */

import type {
  Dashboard,
  DashboardBreakpoint,
  DashboardLayoutMode,
  LayoutItem,
  WidgetInstance,
} from "@/modules/dashboard/dashboards/types";

/** Namespaced UUIDs for the two built-in dashboards — stable across users. */
export const BUILT_IN_OVERVIEW_ID = "00000000-0000-0000-0000-00000000d1a1";
export const BUILT_IN_ANALYTICS_ID = "00000000-0000-0000-0000-00000000d1a2";

/**
 * Number of grid columns per breakpoint. Matches react-grid-layout's
 * defaults so a widget declared `w: 6` on `lg` renders half-width.
 */
export const GRID_COLUMNS: Record<DashboardBreakpoint, number> = {
  lg: 12,
  md: 8,
  sm: 4,
};

/** Widget catalogue keys the Overview built-in ships with. */
const OVERVIEW_KEYS: readonly string[] = [
  "onboarding-checklist",
  "kpi-strip",
  "chart-revenue-week",
  "chart-athletes-per-sport",
  "agenda-today",
  "list-recent-activity",
];

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
 * Build a deterministic widget instance for a catalogue key. Same
 * key + owner → same id, so a built-in dashboard's widgets keep
 * stable ids across reloads. This matters for react-grid-layout's
 * DOM stability + drag rehydration on user overrides.
 */
function stableInstance(key: string, ownerId: string): WidgetInstance {
  return {
    id: `builtin:${ownerId}:${key}`,
    widgetType: key,
  };
}

/**
 * Auto-layout a widget set — walks the sequence and assigns
 * successive positions in a `columns`-wide grid. Widgets marked
 * `span: "full"` take the whole row; `"half"` two-thirds; `"third"`
 * a third. The auto-layout is deterministic and fast enough to run
 * on every open.
 */
function autoLayout(
  keys: readonly string[],
  ownerId: string,
  spanFor: (key: string) => "full" | "half" | "third",
  columns: number,
): { items: LayoutItem[]; widgets: WidgetInstance[] } {
  const widgets: WidgetInstance[] = keys.map((key) => stableInstance(key, ownerId));
  const items: LayoutItem[] = [];

  const widthFor = (span: "full" | "half" | "third"): number => {
    switch (span) {
      case "full":
        return columns;
      case "half":
        return Math.max(1, Math.floor(columns / 2));
      case "third":
        return Math.max(1, Math.floor(columns / 3));
    }
  };

  let cursorX = 0;
  let cursorY = 0;

  for (const widget of widgets) {
    const span = spanFor(widget.widgetType);
    const w = widthFor(span);
    const h = span === "full" ? 3 : 4;

    if (cursorX + w > columns) {
      cursorX = 0;
      cursorY += 4;
    }

    items.push({ widgetId: widget.id, x: cursorX, y: cursorY, w, h });
    cursorX += w;

    if (cursorX >= columns) {
      cursorX = 0;
      cursorY += h;
    }
  }

  return { items, widgets };
}

/**
 * Materialise the Overview built-in for a user. `spanFor` reads the
 * catalogue so the built-ins stay in sync with the catalogue without
 * hard-coding widths here.
 */
export function buildOverviewDashboard(
  ownerId: string,
  tenantId: string,
  spanFor: (key: string) => "full" | "half" | "third",
): Dashboard {
  const layouts = buildLayoutsForKeys(OVERVIEW_KEYS, ownerId, spanFor);

  return {
    id: BUILT_IN_OVERVIEW_ID,
    tenantId,
    ownerId,
    name: "Overview",
    slug: "overview",
    icon: "square-check",
    visibility: "private",
    // Built-ins live in memory and are shown to every tenant member,
    // so their access scope is a private-scoped no-op. Grants never
    // apply to built-ins because they can't be persisted through
    // `update()` — the storage layer rejects mutations on built-ins.
    shareLevel: "private",
    isPinned: true,
    isDefault: true,
    isBuiltIn: true,
    layoutMode: "grid",
    // Cozy density mirrors the app-wide default. Explicit here so a
    // built-in dashboard renders identically whether the field
    // exists on the document or not — one source of truth avoids a
    // surprising "loose" layout when the field is later added to a
    // user's custom document.
    density: "cozy",
    layouts: layouts.layouts,
    widgets: layouts.widgets,
    version: 1,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/** Materialise the Analytics built-in. See {@link buildOverviewDashboard}. */
export function buildAnalyticsDashboard(
  ownerId: string,
  tenantId: string,
  spanFor: (key: string) => "full" | "half" | "third",
): Dashboard {
  const layouts = buildLayoutsForKeys(ANALYTICS_KEYS, ownerId, spanFor);

  return {
    id: BUILT_IN_ANALYTICS_ID,
    tenantId,
    ownerId,
    name: "Analytics",
    slug: "analytics",
    icon: "chart-column",
    visibility: "private",
    // Built-ins live in memory; the share level is a formality that
    // satisfies the required field on {@link Dashboard}. See the
    // matching note on the Overview built-in.
    shareLevel: "private",
    isPinned: true,
    isDefault: false,
    isBuiltIn: true,
    layoutMode: "grid",
    // See the Overview seed for the rationale — cozy is the
    // app-wide default so it lives on the built-in too.
    density: "cozy",
    layouts: layouts.layouts,
    widgets: layouts.widgets,
    version: 1,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/**
 * Runs auto-layout once per breakpoint so a built-in dashboard
 * renders sensibly at every viewport. The widget list is identical
 * across breakpoints (a change to widgets on `lg` mirrors to `md`
 * and `sm`) — only the coordinates change.
 */
function buildLayoutsForKeys(
  keys: readonly string[],
  ownerId: string,
  spanFor: (key: string) => "full" | "half" | "third",
): {
  layouts: Record<DashboardBreakpoint, LayoutItem[]>;
  widgets: WidgetInstance[];
} {
  // Compute the widget list once so ids match across breakpoints.
  const widgets = keys.map((key) => stableInstance(key, ownerId));

  const layoutsAt = (bp: DashboardBreakpoint): LayoutItem[] =>
    autoLayout(keys, ownerId, spanFor, GRID_COLUMNS[bp]).items;

  return {
    widgets,
    layouts: {
      lg: layoutsAt("lg"),
      md: layoutsAt("md"),
      sm: layoutsAt("sm"),
    },
  };
}

/**
 * Template descriptor — used by the "New dashboard" dialog to seed
 * the initial widget set + layout.
 */
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
  layoutMode: DashboardLayoutMode;
  keys: readonly string[];
}

/**
 * Templates shipped by the app. New templates land here; the "New
 * dashboard" dialog renders each option as a card.
 */
export const DASHBOARD_TEMPLATES: readonly DashboardTemplate[] = [
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

/**
 * Compute the auto-layout + widget instances for a template so the
 * "Create dashboard" flow can materialise the dashboard document in
 * a single pass.
 */
export function materialiseTemplate(
  template: DashboardTemplate,
  ownerId: string,
  spanFor: (key: string) => "full" | "half" | "third",
): {
  widgets: WidgetInstance[];
  layouts: Record<DashboardBreakpoint, LayoutItem[]>;
} {
  return buildLayoutsForKeys(template.keys, ownerId, spanFor);
}
