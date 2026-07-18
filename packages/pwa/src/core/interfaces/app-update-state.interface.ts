/**
 * @file app-update-state.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Normalized reactive state exposed by
 *   {@link AppUpdateService}.
 *
 *   Distinct from `IPwaUpdateState`, which reflects the *service
 *   worker* update state (a new frontend bundle is waiting). This
 *   state reflects the *backend-published* app release (the server
 *   says a new version is out and here's the URL to grab it).
 */

/**
 * Reactive app-update state.
 *
 * Referentially stable across `AppUpdateService.getState()` calls —
 * a fresh object is created on every mutation so `useSyncExternalStore`
 * identity checks fire correctly.
 */
export interface IAppUpdateState {
  /**
   * Whether the backend has advertised a newer version than the
   * current build's `currentVersion`. `false` at boot until the
   * first `check()` resolves; `true` once a bump is detected;
   * cleared to `false` by `dismiss()` for the session.
   */
  readonly hasUpdate: boolean;

  /**
   * The current app version (build-time constant, threaded through
   * config). Never mutated by the service — just echoed here for
   * convenient rendering in the update toast.
   */
  readonly current: string | undefined;

  /**
   * The latest version reported by the backend. `undefined` until
   * the first successful `check()` or broadcast.
   */
  readonly latest: string | undefined;

  /**
   * When the backend flags the update as mandatory, apps should
   * force the download flow (e.g. block navigation until the user
   * downloads). Defaults to `false`.
   */
  readonly mandatory: boolean;

  /**
   * Download URL for the CURRENT platform (as selected by
   * `config.platform`). `undefined` when the manifest didn't include
   * one for this platform.
   */
  readonly downloadUrl: string | undefined;

  /**
   * URL to the release notes for the latest version.
   */
  readonly releaseNotesUrl: string | undefined;

  /**
   * ISO-8601 timestamp of when the current state was last updated
   * (either via `check()` or a broadcast). `undefined` until the
   * first update.
   */
  readonly checkedAt: string | undefined;

  /**
   * Whether a `check()` is currently in flight. Useful to disable
   * "Check for updates" affordances while polling.
   */
  readonly isChecking: boolean;

  /**
   * The last error from a failed `check()`, or `null`.
   */
  readonly error: Error | null;
}
