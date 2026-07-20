/**
 * @file detect-notification-support.util.ts
 * @module @stackra/notifications/core/utils
 * @description SSR-safe probe for the browser's `Notification` API.
 *
 *   Returns `false` in every non-browser context — Node.js SSR,
 *   Bun's initial evaluation, RN's JS engine — plus browsers that
 *   deliberately omit the API (macOS Safari in Private Browsing).
 */

/**
 * Detect whether the current environment supports the
 * `Notification` API.
 *
 * @returns `true` iff `globalThis.Notification` is a function.
 */
export function detectNotificationSupport(): boolean {
  // `typeof` guard is the only safe way to probe a global in every
  // environment — SSR / RN / older Safari all react badly to a
  // direct reference.
  if (typeof globalThis === "undefined") return false;
  const g = globalThis as { readonly Notification?: unknown };
  return typeof g.Notification === "function";
}
