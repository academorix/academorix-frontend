/**
 * @file widget-instance.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single widget instance placed on a dashboard.
 *
 *   The `widgetType` matches a key registered in the widget catalogue.
 *   Two instances of the same widget type are legal — each has its own
 *   `id` and independent `config`.
 */

import type { IDashboardFilters } from "./dashboard-filters.interface";

/**
 * A widget instance placed on a dashboard.
 */
export interface IWidgetInstance {
  /** Instance identifier (UUID). Stable across layout edits. */
  id: string;

  /** Catalogue key — matches a widget renderer entry. */
  widgetType: string;

  /**
   * Optional user-facing title override. When absent, the widget
   * renders the catalogue's default title.
   */
  title?: string;

  /**
   * Widget-specific configuration payload. Shape is opaque to the
   * dashboard framework — every widget owns its own runtime schema.
   */
  config?: Record<string, unknown>;

  /**
   * Per-instance filter override. When present, the widget renders
   * against these filters instead of the dashboard-level filters.
   * Dashboard-level filters are treated as defaults the operator can
   * override for a single tile without changing the surrounding page.
   *
   * Leave `undefined` to inherit the dashboard-level filters verbatim.
   * An empty object (`{}`) resets every override without discarding
   * the field.
   */
  filters?: IDashboardFilters;
}
