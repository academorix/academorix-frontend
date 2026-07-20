/**
 * @file widget-default-layout.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Grid-layout constraints for a single widget in the
 *   legacy {@link IWidgetDefinition} shape. Widths are expressed in
 *   12-column grid cells; heights in 60px row units so `1` is one KPI
 *   card tall and `2` is roughly a chart card.
 */

/**
 * Legacy default layout — width/height + minimum + maximum bounds.
 */
export interface IWidgetDefaultLayout {
  /** Width in 12-col grid cells (1–12). */
  w: number;

  /** Height in 60px row units (1–4 for the overview page). */
  h: number;

  /** Minimum width in grid cells. Prevents shrinking KPI cards too far. */
  minW: number;

  /** Minimum height in row units. Prevents chart widgets from collapsing. */
  minH: number;

  /** Maximum width in grid cells. Caps a widget at the container width. */
  maxW: number;

  /** Maximum height in row units. Caps chart widgets so they don't dominate. */
  maxH: number;
}
