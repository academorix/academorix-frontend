/**
 * @file widget-annotation.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single plain-text note pinned to a widget instance.
 *   Owner-private — the public embed viewer never sees annotations.
 */

/**
 * Note pinned to a specific widget instance.
 */
export interface IWidgetAnnotation {
  /** UUID primary key. */
  id: string;

  /** Reference to {@link IWidgetInstance.id}. */
  widgetInstanceId: string;

  /** Reference to {@link IDashboard.id} — indexes the cascade path. */
  dashboardId: string;

  /** Author display label — the playground uses `"You"`. */
  author: string;

  /** Plain-text note body. */
  body: string;

  /** ISO-8601 creation timestamp. */
  createdAt: string;

  /**
   * ISO-8601 last-edit timestamp. Absent on brand-new records — set
   * on every edit thereafter.
   */
  updatedAt?: string;
}
