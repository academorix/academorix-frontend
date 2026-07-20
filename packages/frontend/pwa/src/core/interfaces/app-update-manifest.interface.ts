/**
 * @file app-update-manifest.interface.ts
 * @module @stackra/pwa/core/interfaces
 * @description Wire shape of the app-update payload returned by the
 *   backend `GET /api/v1/app/version` endpoint and the
 *   `AppUpdateEvent` realtime broadcast.
 *
 *   Field names use snake_case to match the Laravel backend
 *   convention exactly — no client-side field renaming. Consumers
 *   who prefer camelCase read `IAppUpdateState` (produced from a
 *   manifest by `AppUpdateService.mergeManifest`), which normalizes
 *   the shape.
 */

/**
 * Raw manifest emitted by the backend.
 *
 * Every field is optional so the service can gracefully handle a
 * partially-populated response (e.g. an early-stage server that
 * ships only the version and a mandatory flag).
 */
export interface IAppUpdateManifest {
  /** Latest published version (semver string, `1.2.3`). */
  readonly current_version?: string;

  /** Whether the update MUST be applied before the app is usable. */
  readonly mandatory?: boolean;

  /** Download URL for web builds. */
  readonly web_update_url?: string;

  /** Download URL for desktop builds. */
  readonly desktop_update_url?: string;

  /** Download URL for mobile builds. */
  readonly mobile_update_url?: string;

  /** URL to the release notes / changelog. */
  readonly release_notes_url?: string;

  /** Whether a web update is available (Laravel-computed flag). */
  readonly web_update_available?: boolean;

  /** Whether a desktop update is available. */
  readonly desktop_update_available?: boolean;

  /** Whether a mobile update is available. */
  readonly mobile_update_available?: boolean;

  /** Server-side dispatch timestamp (unix seconds). */
  readonly timestamp?: number;
}
