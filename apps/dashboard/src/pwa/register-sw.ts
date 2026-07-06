/**
 * @file register-sw.ts
 * @module pwa/register-sw
 *
 * @description
 * Typed wrapper around `useRegisterSW` from `virtual:pwa-register/react`
 * (provided by `vite-plugin-pwa`). Exposes the two reactive booleans and the
 * imperative `updateServiceWorker` action our UI needs to drive the update
 * prompt.
 *
 * ## Why this file exists
 *
 * The plugin ships a working hook out of the box. We wrap it for four reasons:
 *
 * 1. **Explicit types.** The virtual module's types are pulled in via the
 *    `/// <reference types="vite-plugin-pwa/react" />` triple-slash in
 *    `src/vite-env.d.ts`. Consumers of this file get a plain
 *    `UsePwaRegistrationResult` type without wading through the ambient one.
 *
 * 2. **Central place for callbacks + logging.** `onRegisteredSW`,
 *    `onRegisterError`, `onNeedRefresh`, `onOfflineReady` are wired here.
 *    We log via `console.info` / `console.warn` (kept in production by
 *    `vite.config.ts`'s esbuild config) so Sentry sees registration errors.
 *
 * 3. **Feature flag.** We can globally disable the SW in a rescue scenario
 *    by short-circuiting `usePwaRegistration()` — e.g. if a bad SW is
 *    stuck in the wild we can push a build that never registers a new one.
 *
 * 4. **Test surface.** Tests can mock `usePwaRegistration()` cleanly instead
 *    of mocking the virtual module.
 *
 * ## Contract
 *
 * The hook returns three primitives:
 *
 * ```ts
 * const { needRefresh, offlineReady, updateServiceWorker } = usePwaRegistration();
 * ```
 *
 * - `needRefresh` — becomes `true` when a NEW service worker has finished
 *   installing and is waiting to take control. Drives the "Refresh to update"
 *   toast.
 * - `offlineReady` — becomes `true` when the FIRST service worker install
 *   completes (i.e. the app is now available offline). Drives the "Ready to
 *   work offline" toast.
 * - `updateServiceWorker(reload)` — activates the waiting SW. When `reload`
 *   is `true` (our default), the page reloads once the new SW takes control.
 *   When `false`, the page stays put and only new navigations use the new
 *   SW — useful for background-only updates.
 */

import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Return shape of {@link usePwaRegistration}. Kept as a named interface so
 * consumers can type props without importing the virtual module themselves.
 */
export interface UsePwaRegistrationResult {
  /**
   * `true` when a new service worker is waiting to activate. Users have not
   * seen the new build yet — surface a "Refresh to update" prompt.
   *
   * The flag stays `true` until the caller either
   *   1. calls `updateServiceWorker(true)` (accept the update), or
   *   2. explicitly resets it by calling `dismissUpdate()`.
   *
   * Refresh cadence: `vite-plugin-pwa` polls the SW registration every hour
   * by default, so on long-lived tabs the flag can flip mid-session.
   */
  needRefresh: boolean;

  /**
   * `true` after the very first service worker installs successfully. From
   * this point onwards the shell will load offline. Surface a passive
   * "Ready to work offline" toast so users understand the new capability.
   */
  offlineReady: boolean;

  /**
   * Manually clear `needRefresh` — used when the user dismisses the update
   * prompt without accepting. The prompt will surface again on the next
   * detection cycle (or the next page load).
   */
  dismissUpdate: () => void;

  /**
   * Manually clear `offlineReady` — used after showing the one-shot
   * "Ready to work offline" toast so we don't keep re-rendering the badge.
   */
  dismissOfflineReady: () => void;

  /**
   * Activate the waiting service worker.
   *
   * @param reloadPage - When `true` (default), the browser reloads once the
   *   new SW takes control, so the user immediately sees the new build. When
   *   `false`, the SW takes control silently and only future navigations use
   *   the new version.
   *
   * @returns A promise that resolves once the update flow finishes. Errors
   *   are logged internally; callers should treat rejections as fatal and
   *   fall back to a manual `window.location.reload()`.
   */
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

/**
 * Register the service worker and expose its lifecycle as React state.
 *
 * Must be called EXACTLY ONCE per app instance (the underlying
 * `useRegisterSW` uses global state under the hood, but registering twice
 * still triggers redundant lifecycle callbacks and logs). We enforce
 * single-mount by only rendering `<PwaUpdateToast />` in one place — see
 * `src/providers.tsx`.
 *
 * Also see: https://vite-pwa-org.netlify.app/frameworks/react
 */
export function usePwaRegistration(): UsePwaRegistrationResult {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    /**
     * Called once when the SW file has been registered (before `install`
     * completes). Log the URL so a stale-cache incident can be traced from
     * a Sentry report back to the SW build that emitted it.
     */
    onRegisteredSW(swScriptUrl, registration) {
      // eslint-disable-next-line no-console
      console.info(
        `[pwa] service worker registered at ${swScriptUrl} (scope: ${registration?.scope ?? "n/a"})`,
      );
    },

    /**
     * Called if the SW file fails to register (network error, invalid
     * script, malformed response). We log a warning — `console.warn` is
     * preserved by our esbuild config in production so this shows up in
     * error reporting.
     */
    onRegisterError(error) {
      // eslint-disable-next-line no-console
      console.warn("[pwa] service worker registration failed", error);
    },

    /**
     * Called when a new SW is waiting. `useRegisterSW` also flips the
     * `needRefresh` tuple; we log for observability but the state itself
     * drives the UI.
     */
    onNeedRefresh() {
      // eslint-disable-next-line no-console
      console.info("[pwa] new service worker waiting — refresh recommended");
    },

    /**
     * Fires on first-time install (or after a full cache clear). Signals
     * that offline shell access is now available.
     */
    onOfflineReady() {
      // eslint-disable-next-line no-console
      console.info("[pwa] service worker installed — app is now offline-ready");
    },
  });

  return {
    needRefresh,
    offlineReady,
    dismissUpdate: () => setNeedRefresh(false),
    dismissOfflineReady: () => setOfflineReady(false),
    updateServiceWorker,
  };
}
