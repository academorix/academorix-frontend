/**
 * @file invalid-vapid-key.error.ts
 * @module @stackra/notifications/core/errors
 * @description Thrown when the VAPID public key handed to Web Push is
 *   structurally invalid.
 */

import { NotificationError } from './notification.error';

/**
 * Thrown by `PushSubscriptionManager.subscribe(...)` when the caller
 * supplies an unusable VAPID public key — empty, non-string, or
 * malformed URL-safe base64.
 *
 * The manager preserves the caller's input on the `.value` field so
 * an integration test can assert on the exact bad value.
 */
export class InvalidVapidKeyError extends NotificationError {
  public readonly code = 'INVALID_VAPID_KEY' as const;

  /**
   * @param value - The offending value supplied by the caller.
   */
  public constructor(public readonly value: unknown) {
    super('The VAPID public key is invalid — expected a non-empty URL-safe base64 string.');
  }
}
