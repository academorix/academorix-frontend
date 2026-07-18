/**
 * @file web-push-subscription.interface.ts
 * @module @stackra/notifications/push/interfaces
 * @description Serialisable snapshot of a `PushSubscription`.
 *
 *   The native `PushSubscription` object holds a `getKey` method
 *   that can't cross the JSON boundary. This interface flattens
 *   the parts the app actually needs to send to its backend.
 */

/**
 * Serialisable snapshot of a `PushSubscription`.
 *
 * `keys.p256dh` and `keys.auth` are base64-encoded — the app POSTs
 * this shape verbatim to its own push endpoint.
 */
export interface IWebPushSubscription {
  /** Endpoint URL the push service listens on. */
  readonly endpoint: string;
  /**
   * Millisecond timestamp when the subscription expires; `null`
   * when the service issued a subscription with no expiry.
   */
  readonly expirationTime: number | null;
  /**
   * Public keys the push service needs to encrypt the payload —
   * `p256dh` (ECDH) and `auth` (authentication secret).
   */
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
}
