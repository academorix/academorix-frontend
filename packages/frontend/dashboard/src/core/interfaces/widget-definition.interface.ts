/**
 * @file widget-definition.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A widget's static metadata as it appears in the legacy
 *   grid-oriented picker. Distinct from {@link IWidgetEntry}, which is
 *   the newer cohort-based catalogue shape.
 */

import type { WidgetCategory } from "@/core/types/widget-category.type";

import type { IWidgetDefaultLayout } from "./widget-default-layout.interface";

/**
 * Legacy grid-oriented catalogue entry. Kept alongside
 * {@link IWidgetEntry} so consumers that depend on the older grid layout
 * (react-grid-layout defaults + permission gating) don't break.
 */
export interface IWidgetDefinition {
  /** Stable identifier used in layout persistence and the picker. */
  key: string;

  /** Fallback English title; the renderer may translate via i18n. */
  title: string;

  /** One-line description shown in the picker. */
  description: string;

  /** Category used to group cards in the picker dialog. */
  category: WidgetCategory;

  /**
   * Data source (Refine resource) the widget reads from. Used for
   * permission gating (`resource.viewAny`) and feature-flag hiding.
   */
  sourceResource: string;

  /**
   * Permission required to render this widget. Overrides the inferred
   * `<resource>.viewAny` when the widget needs a different scope.
   */
  requiredPermission?: string;

  /** Default width in grid cells (1–3). */
  defaultWidth: 1 | 2 | 3;

  /** Default height in grid cells (1–2). */
  defaultHeight: 1 | 2;

  /**
   * Grid-layout defaults consumed by the drag-and-drop widget grid.
   * Supplies the width, height, and clamp bounds `react-grid-layout`
   * needs — position is computed at render time from the saved layout.
   */
  defaultLayout: IWidgetDefaultLayout;

  /**
   * Whether this widget is available in the picker today. `false`
   * means the definition is reserved (the plan lists it) but the
   * renderer has not shipped yet.
   */
  isAvailable: boolean;
}
