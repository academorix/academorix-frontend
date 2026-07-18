/**
 * @file push-subscription.util.ts
 * @module @academorix/notifications/push/push-subscription.util
 *
 * @description
 * Framework-agnostic helpers for the Web Push subscription lifecycle:
 *
 *  - {@link getExistingPushSubscription} — read the current subscription
 *    if any (does NOT prompt).
 *  - {@link subscribeToPush} — creates a new subscription (WILL prompt
 *    the user for notification permission unless already granted).
 *  - {@link unsubscribeFromPush} — cleanly tears down + tells the
 *    backend.
 *  - {@link serializePushSubscription} — the JSON shape the backend
 *    endpoint (`POST /notifications/subscriptions`) accepts.
 *
 * The React hook that wires these into a component tree lives in
 * `@academorix/notifications/hooks`.
 */

import { urlBase64ToUint8Array } from "./vapid.util";

/**
 * A serialised push subscription in the shape the backend endpoint
 * expects. Matches the standard Web Push JSON envelope.
 */
export interface SerializedPushSubscription {
  readonly endpoint: string;
  readonly expirationTime: number | null;
  readonly keys: {
    readonly p256dh: string;
    readonly auth: string;
  };
}

/**
 * Encodes an `ArrayBuffer` (returned by
 * `PushSubscription.getKey()`) as a base64 string suitable for JSON.
 * The backend's Web Push server library expects base64, not
 * base64-url.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  return btoa(binary);
}

/**
 * Returns whether the browser + the current origin support the
 * Push API. False under HTTP, non-secure contexts, and older
 * browsers (Safari < 16).
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Reads the current push subscription for the given service-worker
 * registration WITHOUT prompting the user. Returns `null` when the
 * user hasn't subscribed yet or push isn't supported.
 */
export async function getExistingPushSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

/**
 * Options for {@link subscribeToPush}.
 */
export interface SubscribeToPushOptions {
  /** The service worker registration to bind the subscription to. */
  readonly registration: ServiceWorkerRegistration;
  /** Base64-url-encoded VAPID public key from the backend. */
  readonly vapidPublicKey: string;
  /**
   * Whether the subscription should visibly notify the user when a
   * push arrives. Chrome requires `true`; some browsers accept `false`
   * for silent pushes.
   */
  readonly userVisibleOnly?: boolean;
}

/**
 * Creates a new push subscription. WILL prompt the user for
 * notification permission if not already granted — call this ONLY
 * from a user gesture (e.g. clicking "Enable notifications").
 *
 * Returns the `PushSubscription` on success. Callers usually pass
 * the result through {@link serializePushSubscription} before POSTing
 * to the backend.
 */
export async function subscribeToPush(options: SubscribeToPushOptions): Promise<PushSubscription> {
  const applicationServerKey = urlBase64ToUint8Array(options.vapidPublicKey);

  return options.registration.pushManager.subscribe({
    userVisibleOnly: options.userVisibleOnly ?? true,
    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
  });
}

/**
 * Tears down a push subscription. Returns `true` when a subscription
 * was actively unsubscribed; `false` when there was nothing to tear
 * down.
 */
export async function unsubscribeFromPush(subscription: PushSubscription): Promise<boolean> {
  return subscription.unsubscribe();
}

/**
 * Converts a live `PushSubscription` to the JSON shape the backend
 * accepts. Handles the base64 conversion of the `p256dh` + `auth`
 * keys.
 */
export function serializePushSubscription(
  subscription: PushSubscription,
): SerializedPushSubscription {
  const p256dhKey = subscription.getKey("p256dh");
  const authKey = subscription.getKey("auth");

  if (!p256dhKey || !authKey) {
    throw new Error(
      "Push subscription is missing required encryption keys (p256dh/auth). " +
        "The browser produced an invalid subscription — retry after re-subscribing.",
    );
  }

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: arrayBufferToBase64(p256dhKey),
      auth: arrayBufferToBase64(authKey),
    },
  };
}
