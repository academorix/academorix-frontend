/**
 * @file vapid.util.ts
 * @module @academorix/notifications/push/vapid.util
 *
 * @description
 * Small helpers for Web Push Voluntary Application Server
 * Identification (VAPID). The push subscription API expects the
 * public key as a `Uint8Array` — this file converts the base64-url
 * string the backend serves into the binary form the browser wants.
 *
 * We intentionally don't bundle the base64-url decoder as a
 * dependency — it's ~15 lines and the browser's `atob` handles the
 * heavy lifting.
 */

/**
 * Converts a base64-url-encoded VAPID public key to a Uint8Array
 * suitable for passing to `pushManager.subscribe({ applicationServerKey })`.
 *
 * Base64-url differs from base64 in two ways:
 *   - `-` replaces `+`, `_` replaces `/`.
 *   - Padding (`=`) is optional (usually stripped).
 *
 * This function normalises both and returns the raw bytes.
 */
export function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    bytes[i] = rawData.charCodeAt(i);
  }

  return bytes;
}
