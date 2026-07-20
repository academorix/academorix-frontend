/**
 * @file events.constant.ts
 * @module @stackra/notifications/core/constants
 * @description Notification lifecycle event names dispatched through
 *   the optional `IAnalyticsManager` (bound under `ANALYTICS_MANAGER`).
 *
 *   The map is `as const` so consumers can `type EventName =
 *   (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS]`
 *   for exhaustive checks in switch statements. Every event name
 *   uses the `notifications.*` namespace to stay distinct from
 *   `pwa.*` in the analytics stack.
 */

/**
 * Canonical notification lifecycle event names.
 */
export const NOTIFICATION_EVENTS = {
  /** Fired when the app asks the browser for notification permission. */
  NOTIFICATION_PERMISSION_REQUESTED: "notifications.permission.requested",
  /** Fired when the user grants notification permission. */
  NOTIFICATION_PERMISSION_GRANTED: "notifications.permission.granted",
  /** Fired when the user denies notification permission. */
  NOTIFICATION_PERMISSION_DENIED: "notifications.permission.denied",
  /** Fired when the permission remains at `'default'` (no decision). */
  NOTIFICATION_PERMISSION_DEFAULT: "notifications.permission.default",

  /** Fired when a notification is dispatched to the in-app centre. */
  IN_APP_DISPATCHED: "notifications.in_app.dispatched",
  /** Fired when the user marks an in-app notification as seen. */
  IN_APP_SEEN: "notifications.in_app.seen",
  /** Fired when the user dismisses a single in-app notification. */
  IN_APP_DISMISSED: "notifications.in_app.dismissed",
  /** Fired when the user clears the entire in-app centre. */
  IN_APP_CLEARED: "notifications.in_app.cleared",

  /** Fired when Web Push subscription succeeds. */
  WEB_PUSH_SUBSCRIBED: "notifications.web_push.subscribed",
  /** Fired when Web Push unsubscribe succeeds. */
  WEB_PUSH_UNSUBSCRIBED: "notifications.web_push.unsubscribed",
  /** Fired when Web Push subscription throws. */
  WEB_PUSH_SUBSCRIPTION_FAILED: "notifications.web_push.subscription_failed",

  /** Fired when the native Expo push token is obtained. */
  NATIVE_PUSH_TOKEN_OBTAINED: "notifications.native_push.token_obtained",
  /** Fired when the native push token retrieval fails. */
  NATIVE_PUSH_TOKEN_FAILED: "notifications.native_push.token_failed",

  /** Fired when a channel driver registers via `NotificationManager.register`. */
  CHANNEL_DRIVER_REGISTERED: "notifications.channel.registered",

  /** Fired when a channel driver reports a successful delivery. */
  DELIVERY_SUCCEEDED: "notifications.delivery.succeeded",
  /** Fired when a channel driver's delivery throws. */
  DELIVERY_FAILED: "notifications.delivery.failed",

  /** Fired when notification preferences change (set / patch / setChannel / quiet hours). */
  PREFERENCES_CHANGED: "notifications.preferences.changed",
  /**
   * Fired the first time `isInQuietHours()` transitions to `true`
   * per {@link NotificationPreferencesService} instance. Payload
   * carries the active window (start / end / timezone).
   */
  QUIET_HOURS_ACTIVE: "notifications.preferences.quiet_hours_active",
  /**
   * Fired when a `setChannelEnabled(category, channel, false)`
   * call actually flips a channel OFF (mandatory-on pairs are
   * silently skipped and do NOT emit this event).
   */
  CHANNEL_DISABLED: "notifications.preferences.channel_disabled",
  /**
   * Fired when a `setChannelEnabled(category, channel, true)`
   * call actually flips a channel ON.
   */
  CHANNEL_ENABLED: "notifications.preferences.channel_enabled",
} as const;

/** Union of every canonical notifications event name. */
export type NotificationEventName = (typeof NOTIFICATION_EVENTS)[keyof typeof NOTIFICATION_EVENTS];
