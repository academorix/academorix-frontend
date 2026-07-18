/**
 * @file notification-action.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description A single actionable button inside a notification.
 *
 *   Mirrors the shape browsers accept in the
 *   [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notification)
 *   `actions` array — an id (`action`), a label (`title`), and an
 *   optional icon URL.
 */

/**
 * A single actionable button inside a notification.
 *
 * The `action` id is echoed back through the notification click
 * handler so the consumer can dispatch the right side-effect.
 */
export interface INotificationAction {
  /** Machine-readable action id echoed on click. */
  readonly action: string;
  /** Human-readable label shown on the button. */
  readonly title: string;
  /** Optional URL of an icon shown alongside the label. */
  readonly icon?: string;
}
