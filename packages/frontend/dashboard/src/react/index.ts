/**
 * @file index.ts
 * @module @stackra/dashboard/react
 * @description Public API of the `@stackra/dashboard/react` subpath.
 *
 *   Exposes the React hooks + the thin dispatch component. Every
 *   symbol is headless (no HeroUI, no design-system primitives) so
 *   consumers can drive the framework from any visual shell.
 */

// ── Hooks ──────────────────────────────────────────────────────
export {
  clearStoredLayout,
  computeDefaultLayoutItems,
  LAYOUT_SCHEMA_VERSION,
  OVERVIEW_GRID_COLUMNS,
  readStoredLayout,
  useWidgetLayout,
  writeStoredLayout,
} from "./hooks/use-widget-layout";
export type {
  IUseWidgetLayoutOptions,
  IUseWidgetLayoutResult,
} from "./hooks/use-widget-layout";

export { useDashboards } from "./hooks/use-dashboards";
export type { IUseDashboardsResult } from "./hooks/use-dashboards";

export {
  DEFAULT_DASHBOARD_ROUTE_SLUG,
  resolveCurrent,
  useCurrentDashboard,
} from "./hooks/use-current-dashboard";
export type { IUseCurrentDashboardResult } from "./hooks/use-current-dashboard";

export { useDashboardEditor } from "./hooks/use-dashboard-editor";
export type {
  EditorPersistFn,
  IUseDashboardEditor,
} from "./hooks/use-dashboard-editor";

export { useWidgetKeyboardNav } from "./hooks/use-widget-keyboard-nav";
export type {
  IUseWidgetKeyboardNav,
  IUseWidgetKeyboardNavInput,
  IWidgetKeyboardProps,
} from "./hooks/use-widget-keyboard-nav";

// ── Components ─────────────────────────────────────────────────
export { WidgetRenderer } from "./components/widget-renderer";
export type { IWidgetRendererProps } from "./components/widget-renderer";
