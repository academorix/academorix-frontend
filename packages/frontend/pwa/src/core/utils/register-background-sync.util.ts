/**
 * @file register-background-sync.util.ts
 * @module @stackra/pwa/core/utils
 * @description Register a one-shot Background Sync tag on a
 *   service-worker registration.
 *
 *   Chromium-only. Falls back gracefully when the API isn't there
 *   — apps that need reliability across browsers layer this on top
 *   of the offline queue rather than relying on it alone.
 */

/**
 * Register a one-shot background-sync tag if the API is available.
 *
 * @param tag - Unique tag name (matches the service worker's `sync`
 *   event listener).
 * @param registration - The service-worker registration to attach
 *   the tag to.
 * @returns `true` when the sync was registered; `false` when the
 *   API is unavailable or registration failed.
 *
 * @example
 * ```typescript
 * const reg = await navigator.serviceWorker.getRegistration();
 * if (reg) await registerBackgroundSync('flush-messages', reg);
 * ```
 */
export async function registerBackgroundSync(
  tag: string,
  registration: ServiceWorkerRegistration,
): Promise<boolean> {
  // Standard-lib DOM types don't include `sync` on ServiceWorkerRegistration
  // yet — Chromium ships it but it's an interop lag.
  const sync = (
    registration as unknown as {
      sync?: { register(tag: string): Promise<void> };
    }
  ).sync;
  if (!sync) return false;

  try {
    await sync.register(tag);
    return true;
  } catch {
    // fail-soft — the caller treats `false` as "sync not scheduled,
    // consider retrying yourself".
    return false;
  }
}
