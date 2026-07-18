/**
 * @file app-version.interface.ts
 * @module @stackra/contracts/interfaces/pwa
 * @description Shape of the server-declared app-version state.
 *
 *   Owned by `@stackra/pwa` but exposed through contracts so any
 *   package (settings admin UI, sdui runtime, install prompt banners)
 *   can inject the canonical service without depending on the PWA
 *   runtime.
 */

/**
 * Per-platform update state.
 *
 * @remarks Each platform reports two flags: whether an update is
 *   available (server has a newer build), and the URL to redirect the
 *   user to. The client picks the platform-specific fields based on
 *   its own detection.
 */
export interface IAppVersionPlatformState {
  /** Whether a newer build exists for the platform. */
  readonly available: boolean;
  /** Redirect URL to trigger the update (store link, download page). */
  readonly updateUrl: string;
}

/**
 * The server-declared app-version snapshot, matching the payload of
 * `GET /api/v1/app/version` and the `app.updates` broadcast.
 */
export interface IAppVersion {
  /** Latest published version (e.g. `'1.4.0'`). */
  readonly currentVersion: string;
  /**
   * Minimum supported version. Clients running an older version
   * should treat the update as mandatory.
   */
  readonly minVersion: string;
  /** Optional URL to the release notes page. */
  readonly releaseNotesUrl?: string;
  /**
   * Whether the update is mandatory — clients should block usage
   * until the user updates.
   */
  readonly mandatory: boolean;
  /** Web platform state. */
  readonly web: IAppVersionPlatformState;
  /** Desktop platform state (Electron / Tauri). */
  readonly desktop: IAppVersionPlatformState;
  /** Mobile platform state (React Native / Capacitor). */
  readonly mobile: IAppVersionPlatformState;
  /** Server timestamp when the snapshot was published (seconds). */
  readonly timestamp: number;
}
