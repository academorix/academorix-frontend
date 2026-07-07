/**
 * @file widget.types.ts
 * @module modules/dashboard/widgets/widget.types
 *
 * @description
 * The typed contract every dashboard widget renders against, plus the
 * catalogue-metadata shape that drives the widget picker and the layout
 * persistence layer. See {@link DASHBOARD_UX_PLAN.md} §4.2 and §4.5.
 *
 * A widget renderer is a plain React component that receives its runtime
 * context (active scope, identity, its per-instance config) and returns a
 * `ReactNode`. Config is a plain object so widgets can carry their own state
 * (a period selector, a filter, a sort choice) without the shell knowing the
 * shape.
 */

import type { ReactNode } from "react";

/** Categories that group widgets in the picker dialog. */
export type WidgetCategory =
  "onboarding" | "numbers" | "charts" | "calendar" | "people" | "money" | "compliance";

/**
 * The grid-layout constraints for a single widget. Widths (`w`, `minW`,
 * `maxW`) are expressed in **12-column grid cells** (the plan's default —
 * see `DASHBOARD_UX_PLAN.md` §4.2); heights (`h`, `minH`, `maxH`) are
 * expressed in **60px row units** so 1 row is one KPI card tall and 2 rows
 * is roughly a chart card. Kept as a plain interface (not a class) so it
 * survives JSON round-trips into `localStorage` and back.
 *
 * `react-grid-layout`'s own `Layout` type is a superset of these fields
 * (adding `i`, `x`, `y`, plus drag/resize flags); we deliberately narrow to
 * only the size hints here — position + drag flags are computed at render
 * time from the persisted per-user layout state.
 */
export interface WidgetDefaultLayout {
  /** Width in 12-col grid cells (1–12). */
  w: number;
  /** Height in 60px row units (1–4 for the overview page). */
  h: number;
  /** Minimum width in grid cells. Prevents users from shrinking KPI cards. */
  minW: number;
  /** Minimum height in row units. Prevents chart widgets from collapsing. */
  minH: number;
  /** Maximum width in grid cells. Caps a widget at the container width. */
  maxW: number;
  /** Maximum height in row units. Caps chart widgets so they don't dominate. */
  maxH: number;
}

/**
 * Runtime context passed to every widget renderer. The shell resolves scope
 * and identity once per session and hands them to each renderer, so a widget
 * never has to `useGetIdentity` or `useScope` on its own.
 */
export interface WidgetRendererContext {
  /**
   * The widget's persisted configuration. Widgets own the shape; the shell
   * only reads and writes it as an opaque record. Empty on first render.
   */
  config: Record<string, unknown>;
  /**
   * Persists a new configuration for this widget instance. The shell debounces
   * to avoid thrashing the persistence layer during rapid interactions.
   */
  onConfigChange: (next: Record<string, unknown>) => void;
}

/**
 * A widget renderer is a React function component that receives the runtime
 * context. Renderers are pure with respect to their inputs plus whatever data
 * they read via `useList` / `useOne`; the shell does not memoise them.
 */
export type WidgetRenderer = (context: WidgetRendererContext) => ReactNode;

/**
 * A widget's static metadata as it appears in the picker. Every entry in the
 * catalogue (see {@link "@/modules/dashboard/widgets/widget.catalogue".widgetCatalogue})
 * conforms to this shape. Renderers are registered separately in
 * {@link "@/modules/dashboard/widgets/widget.registry"} so a widget can appear
 * in the picker before its renderer ships.
 */
export interface WidgetDefinition {
  /** Stable identifier used in layout persistence and the picker. */
  key: string;
  /** Fallback English title; the renderer may translate via i18n. */
  title: string;
  /** One-line description shown in the picker. */
  description: string;
  /** Category used to group cards in the picker dialog. */
  category: WidgetCategory;
  /**
   * Refine resource the widget reads from. Used by the shell for permission
   * gating (`resource.viewAny`) and to hide widgets whose backing resource is
   * feature-flagged off for the tenant.
   */
  sourceResource: string;
  /**
   * Permission required to render this widget. Overrides the inferred
   * `<resource>.viewAny` when the widget needs a different scope (for example
   * `payments.forecast` on the cash-flow forecast widget).
   */
  requiredPermission?: string;
  /** Default width in grid cells (1–3). */
  defaultWidth: 1 | 2 | 3;
  /** Default height in grid cells (1–2). */
  defaultHeight: 1 | 2;
  /**
   * Grid-layout defaults consumed by the drag-and-drop widget grid
   * (`components/widget-grid.tsx`). Supplies the width, height, and
   * clamp bounds `react-grid-layout` needs — position (`x`, `y`) is
   * computed at render time from the saved per-user layout, not this
   * definition. See {@link WidgetDefaultLayout} for the unit conventions.
   */
  defaultLayout: WidgetDefaultLayout;
  /**
   * Whether this widget is available in the picker today. `false` means the
   * definition is reserved (the plan lists it) but the renderer has not
   * shipped yet, so the picker shows it disabled with a "Coming soon" label.
   */
  isAvailable: boolean;
}

/** A single item in a saved dashboard layout. */
export interface DashboardLayoutItem {
  widgetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Reserved for owner-forced widgets in Phase 1d. */
  isStatic?: boolean;
}

/** A responsive layout keyed by breakpoint. Populated in Phase 1d. */
export interface DashboardLayoutBreakpoint {
  columns: number;
  rowHeight: number;
  items: DashboardLayoutItem[];
}

/**
 * A saved dashboard layout. Owners can promote a personal layout to a tenant
 * preset via `scope: "tenant"`; the picker groups presets separately from
 * personal layouts.
 */
export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  scope: "user" | "role" | "tenant";
  breakpoints: Record<"lg" | "md" | "sm", DashboardLayoutBreakpoint>;
}
