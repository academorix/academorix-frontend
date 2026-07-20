/**
 * @file notification-manager-snapshot.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Referentially stable snapshot of the notification
 *   manager's observable state.
 *
 *   Consumed by `useSyncExternalStore` inside the React binding.
 */

import type { INotificationPermissionState } from "./notification-permission-state.interface";

/**
 * Manager-level snapshot exposed to React subscribers.
 */
export interface INotificationManagerSnapshot {
  /** Whether the underlying platform supports notifications. */
  readonly isSupported: boolean;
  /** Current permission state. */
  readonly permission: INotificationPermissionState;
  /** Every channel id currently registered. */
  readonly channels: readonly string[];
}
