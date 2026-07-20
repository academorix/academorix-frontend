/**
 * @file layout-item.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single layout entry describing where a widget renders
 *   inside the responsive grid at a given breakpoint. Coordinates are
 *   grid-column / grid-row units.
 */

/**
 * Placement + size for a widget instance inside the responsive grid.
 */
export interface ILayoutItem {
  /** Reference to {@link IWidgetInstance.id}. */
  widgetId: string;

  /** Column origin (0-indexed). */
  x: number;

  /** Row origin (0-indexed). */
  y: number;

  /** Column span in grid cells. */
  w: number;

  /** Row span in grid cells. */
  h: number;

  /** Optional minimum column span the grid engine must respect. */
  minW?: number;

  /** Optional minimum row span the grid engine must respect. */
  minH?: number;
}
