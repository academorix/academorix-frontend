/**
 * @file notification-channel-driver.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Contract implemented by every channel driver
 *   registered with {@link NotificationManager}.
 *
 *   Every driver picks its own `id` — `'in-app'`, `'web-push'`,
 *   `'email'`, `'sms'`, and so on. The manager routes each
 *   dispatched payload to the drivers whose id appears in the
 *   requested channel set.
 */

import type { INotificationPayload } from "./notification-payload.interface";

/**
 * A channel driver.
 *
 * `deliver(payload)` MUST be fail-soft — a throwing driver never
 * propagates the error into the manager. Async drivers return a
 * promise; sync drivers return `void`. Whichever they choose, the
 * manager awaits the return value so a rejected promise is caught
 * and reported through the analytics bridge.
 */
export interface INotificationChannelDriver {
  /**
   * Channel id this driver handles. Matches the `id` fields listed in
   * `NotificationManager.dispatch({ channels: [...] })`.
   */
  readonly id: string;

  /**
   * Deliver a single payload. Return a promise for async delivery.
   *
   * @param payload - The notification to deliver.
   */
  deliver(payload: INotificationPayload): void | Promise<void>;
}
