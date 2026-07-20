/**
 * @file channels.constant.ts
 * @module @stackra/notifications/core/constants
 * @description Built-in channel identifiers dispatched to by
 *   {@link NotificationManager} out of the box.
 *
 *   Consumers can register additional channels — an `email`, `sms`,
 *   `slack`, etc. — via
 *   `NotificationModule.forFeature(DriverClass)` and the driver
 *   receives every payload routed at its `id`.
 */

/**
 * Well-known channel identifiers.
 *
 * Every consumer's channel driver picks its own `id`; the constants
 * here document the ids the built-in drivers respond to. Kept
 * `as const` so `keyof typeof DEFAULT_NOTIFICATION_CHANNELS` is a
 * closed union.
 */
export const DEFAULT_NOTIFICATION_CHANNELS = {
  /**
   * Routes payloads to the {@link InAppNotificationCentre} — the
   * durable in-memory queue backed by `@stackra/storage`.
   */
  IN_APP: 'in-app',
  /**
   * Marks a payload for server-side Web Push delivery. The manager
   * emits `WEB_PUSH_SUBSCRIBED` events on `subscribe(...)` — the
   * actual delivery is performed by the app's backend against the
   * stored subscription.
   */
  WEB_PUSH: 'web-push',
  /**
   * Marks a payload for native (Expo) push delivery via a device
   * token. Delivery is again server-side; the manager just records
   * intent.
   */
  NATIVE_PUSH: 'native-push',
} as const;

/** Union of every built-in channel identifier. */
export type DefaultNotificationChannel =
  (typeof DEFAULT_NOTIFICATION_CHANNELS)[keyof typeof DEFAULT_NOTIFICATION_CHANNELS];
