/**
 * @file push-not-supported.error.ts
 * @module @stackra/notifications/core/errors
 * @description Thrown when push APIs are unavailable in the current environment.
 */

import { NotificationError } from "./notification.error";

/**
 * Thrown by `PushSubscriptionManager` when the browser lacks
 * `Notification`, `PushManager`, or `serviceWorker` — the three
 * APIs Web Push requires.
 *
 * Consumers catch this to fall back to an alternative channel
 * (SMS, email) or to hide push-related UI entirely.
 */
export class PushNotSupportedError extends NotificationError {
  public readonly code = "PUSH_NOT_SUPPORTED" as const;
}
