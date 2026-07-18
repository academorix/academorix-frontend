/**
 * @file url-b64-to-uint8array.util.ts
 * @module @stackra/notifications/push/utils
 * @description Convert a URL-safe base64 VAPID key to `Uint8Array`.
 *
 *   `PushManager.subscribe` requires the `applicationServerKey` as
 *   a `Uint8Array`. VAPID keys are typically distributed as
 *   URL-safe base64 strings — this helper does the standard
 *   replacement (`-` → `+`, `_` → `/`), pads, decodes via `atob`,
 *   and copies to a fresh typed array.
 */

/**
 * Convert a URL-safe base64 string to a `Uint8Array`.
 *
 * @param base64String - URL-safe base64 string (VAPID key).
 * @returns The decoded byte array.
 */
export function urlB64ToUint8Array(base64String: string): Uint8Array {
  // Base64 encodes 3 bytes per 4 characters; pad the trailing group
  // to a multiple of 4 so `atob` accepts the input.
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  // Normalise URL-safe alphabet to standard alphabet.
  // support-utilities-exempt: character-class regex is a language feature; Str.replace only handles literals.
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  // `atob` returns a binary string; each character's charCode is
  // one byte of the decoded output.
  const rawData = typeof atob === 'function' ? atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
