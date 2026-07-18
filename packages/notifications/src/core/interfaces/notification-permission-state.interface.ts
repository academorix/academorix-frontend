/**
 * @file notification-permission-state.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Immutable snapshot of the browser's notification
 *   permission state.
 */

/**
 * Permission state exposed by
 * {@link NotificationManager.getPermissionState}.
 *
 * When the runtime doesn't expose the `Notification` API (SSR,
 * private mode, old browsers), `supported` is `false` and
 * `permission` is `'denied'` so consumer branches can early-out on
 * a single check.
 */
export interface INotificationPermissionState {
  /** Whether the environment exposes the `Notification` API. */
  readonly supported: boolean;
  /** Current permission — mirrors `NotificationPermission`. */
  readonly permission: NotificationPermission;
}
