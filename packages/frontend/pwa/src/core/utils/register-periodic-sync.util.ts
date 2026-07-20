/**
 * @file register-periodic-sync.util.ts
 * @module @stackra/pwa/core/utils
 * @description Register a Periodic Background Sync tag on a
 *   service-worker registration.
 *
 *   Periodic Background Sync is Chromium-only (with the
 *   `'periodic-background-sync'` permission granted). This helper
 *   is fail-soft — it returns `false` when the API is unavailable
 *   or the permission is denied.
 */

/** Options accepted by {@link registerPeriodicSync}. */
export interface IRegisterPeriodicSyncOptions {
  /** Minimum interval (ms) between sync runs. */
  readonly minIntervalMs: number;
}

/**
 * Register a periodic-background-sync tag if the API + permission
 * are both available.
 *
 * @param tag - Unique tag name (matches the service worker's
 *   `periodicsync` event listener).
 * @param registration - The service-worker registration to attach
 *   the tag to.
 * @param options - Sync options (interval).
 * @returns `true` when the sync was registered; `false` when the
 *   API is unavailable or the permission was denied.
 *
 * @example
 * ```typescript
 * const reg = await navigator.serviceWorker.getRegistration();
 * if (reg) {
 *   await registerPeriodicSync('sync-messages', reg, { minIntervalMs: 60_000 });
 * }
 * ```
 */
export async function registerPeriodicSync(
  tag: string,
  registration: ServiceWorkerRegistration,
  options: IRegisterPeriodicSyncOptions,
): Promise<boolean> {
  // Structural check — `periodicSync` is not typed on the standard
  // lib.dom types, hence the deliberate cast.
  const periodicSync = (
    registration as unknown as {
      periodicSync?: { register(tag: string, opts: { minInterval: number }): Promise<void> };
    }
  ).periodicSync;
  if (!periodicSync) return false;

  // Permission gate — Chromium requires the user to have granted
  // `periodic-background-sync` via a prior `permissions.query`.
  try {
    if (typeof navigator !== "undefined" && navigator.permissions?.query) {
      const status = await navigator.permissions.query({
        name: "periodic-background-sync" as PermissionName,
      });
      if (status.state !== "granted") return false;
    }
    await periodicSync.register(tag, { minInterval: options.minIntervalMs });
    return true;
  } catch {
    // fail-soft — API present but registration failed (quota, browser
    // policy, etc.). The caller should treat the return as a hint,
    // not a hard failure.
    return false;
  }
}
