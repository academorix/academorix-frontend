/**
 * @file request-persistent-storage.util.ts
 * @module @stackra/pwa/core/utils
 * @description Request the `navigator.storage.persist()` permission.
 *
 *   Persistent storage prevents the browser from evicting the app's
 *   `IndexedDB` / `Cache Storage` / `localStorage` data under
 *   pressure. Every mainstream desktop browser (Chrome, Edge, Firefox,
 *   Safari 15+) supports it; older Safari / older Android WebViews
 *   don't and this helper fails soft.
 */

/**
 * Request persistent storage.
 *
 * @returns `true` when the permission was granted (or already
 *   present); `false` when the API is unavailable OR the browser
 *   denies the request.
 *
 * @example
 * ```typescript
 * if (await requestPersistentStorage()) {
 *   analytics.track('storage.persistent.granted');
 * }
 * ```
 */
export async function requestPersistentStorage(): Promise<boolean> {
  // SSR guard.
  if (typeof navigator === 'undefined' || !navigator.storage) return false;
  // `navigator.storage.persist` is a stage-3 API and might not
  // be present on older Safari builds; check before invoking.
  if (typeof navigator.storage.persist !== 'function') return false;

  try {
    return await navigator.storage.persist();
  } catch {
    // fail-soft — browser policy can reject the request without
    // throwing typically, but treat throws as denial.
    return false;
  }
}
