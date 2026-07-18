/**
 * @file notification-manager.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Public contract implemented by
 *   {@link NotificationManager} — the multi-channel notification
 *   orchestrator.
 *
 *   Deliberately narrow so tests and other packages can bind against
 *   a mock without pulling the full manager class into their
 *   dependency graph.
 */

import type { IDeliveryReport } from './delivery-report.interface';
import type { INotificationChannelDriver } from './notification-channel-driver.interface';
import type { INotificationManagerSnapshot } from './notification-manager-snapshot.interface';
import type { INotificationPayload } from './notification-payload.interface';
import type { INotificationPermissionState } from './notification-permission-state.interface';

/**
 * Listener signature emitted on every snapshot change.
 */
export type NotificationManagerListener = () => void;

/**
 * Public API of the notification manager.
 */
export interface INotificationManager {
  /**
   * Register (or replace) a channel driver. Idempotent — a driver
   * with the same `id` replaces the previous one.
   */
  register(driver: INotificationChannelDriver): void;

  /**
   * Deliver a payload to every driver whose `id` appears in
   * `channels` — or to the module's `defaultStack` when `channels`
   * is omitted.
   *
   * @param payload - The notification to deliver.
   * @param options - Optional dispatch settings.
   *   `options.channels` — override the stack for this dispatch.
   * @returns A per-channel delivery report.
   */
  dispatch(
    payload: INotificationPayload,
    options?: { readonly channels?: readonly string[] }
  ): Promise<readonly IDeliveryReport[]>;

  /** Snapshot of the manager's permission + channels state. */
  getSnapshot(): INotificationManagerSnapshot;

  /** Read the current permission state (SSR-safe). */
  getPermissionState(): INotificationPermissionState;

  /**
   * Ask the browser for notification permission (Web only). Silently
   * resolves to `'denied'` on unsupported environments.
   */
  requestPermission(): Promise<NotificationPermission>;

  /** Subscribe to snapshot changes. */
  subscribe(listener: NotificationManagerListener): () => void;
}
