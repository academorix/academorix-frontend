/**
 * @file delivery-report.interface.ts
 * @module @stackra/notifications/core/interfaces
 * @description Report emitted by {@link NotificationManager.dispatch}
 *   for each channel a payload was delivered to.
 */

/**
 * The outcome of delivering one payload through one channel driver.
 *
 * The manager returns an array of these — one per channel — so
 * consumers can surface per-channel results in an admin dashboard.
 */
export interface IDeliveryReport {
  /** The channel id the payload was routed to. */
  readonly channelId: string;
  /** Millisecond timestamp when delivery finished. */
  readonly deliveredAt: number;
  /**
   * Non-`null` when the driver threw or its returned promise
   * rejected. Consumers use `report.error != null` for a fast
   * success / failure check.
   */
  readonly error: Error | null;
}
