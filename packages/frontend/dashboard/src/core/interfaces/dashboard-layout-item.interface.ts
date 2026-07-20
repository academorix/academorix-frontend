/**
 * @file dashboard-layout-item.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Legacy layout entry keyed by `widgetKey` (catalogue key)
 *   rather than `widgetId` (per-instance identifier). Consumed by the
 *   older `use-widget-layout` persistence flow.
 */

/**
 * Layout item keyed by catalogue key.
 *
 * The legacy overview layout stores one entry per widget catalogue
 * key. Position/size fields match `react-grid-layout`'s shape so the
 * two integrate directly.
 */
export interface IDashboardLayoutItem {
  /** Catalogue key the layout entry refers to. */
  widgetKey: string;

  /** Column origin (0-indexed). */
  x: number;

  /** Row origin (0-indexed). */
  y: number;

  /** Column span in grid cells. */
  w: number;

  /** Row span in grid cells. */
  h: number;

  /**
   * Reserved for owner-forced widgets — layout items with `isStatic`
   * true are pinned and cannot be dragged or resized by users.
   */
  isStatic?: boolean;
}
