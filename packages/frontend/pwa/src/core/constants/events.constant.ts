/**
 * @file events.constant.ts
 * @module @stackra/pwa/core/constants
 * @description PWA lifecycle event names.
 *
 *   Every event `PwaService` emits through the optional analytics
 *   bridge is named here. Consumers can also key their own logger /
 *   event-bus dispatch on these names for parity.
 *
 *   Push / notification / offline-queue events used to live here but
 *   have moved: push events → `NOTIFICATION_EVENTS` in
 *   `@stackra/notifications`; offline queue drained/enqueued events →
 *   consumers use `@stackra/sync` / `@stackra/queue` directly.
 */

/**
 * Canonical PWA lifecycle event names.
 *
 * The map is `as const` so consumers can `type EventName =
 * (typeof PWA_EVENTS)[keyof typeof PWA_EVENTS]` for exhaustive
 * checks in switch statements.
 */
export const PWA_EVENTS = {
  /** Fired the first time the browser exposes `beforeinstallprompt`. */
  INSTALL_PROMPT_SHOWN: "pwa.install.prompt_shown",
  /** Fired when the user accepts the browser's install prompt. */
  INSTALL_ACCEPTED: "pwa.install.accepted",
  /** Fired when the user dismisses the browser's install prompt. */
  INSTALL_DISMISSED: "pwa.install.dismissed",

  /** Fired when the service-worker reports a waiting worker. */
  UPDATE_AVAILABLE: "pwa.update.available",
  /** Fired when the user accepts the update (`SKIP_WAITING`). */
  UPDATE_ACCEPTED: "pwa.update.accepted",
  /** Fired when the user defers the update. */
  UPDATE_DISMISSED: "pwa.update.dismissed",

  /** Fired when the app boots in standalone mode. */
  STANDALONE_LAUNCHED: "pwa.standalone.launched",

  /** Fired when the browser reports going offline. */
  OFFLINE_ENTERED: "pwa.offline.entered",

  /** Fired when `navigator.storage.persist()` grants the permission. */
  PERSISTENT_STORAGE_GRANTED: "pwa.storage.persistent.granted",
  /** Fired when `navigator.storage.persist()` denies the permission. */
  PERSISTENT_STORAGE_DENIED: "pwa.storage.persistent.denied",

  /**
   * Fired when the backend advertises a newer release. Payload:
   * `{ current, latest, mandatory, source: 'poll' | 'broadcast' }`.
   */
  APP_UPDATE_AVAILABLE: "pwa.app_update.available",

  /**
   * Fired when the user accepts the update (typically after clicking
   * a download button in the toast).
   */
  APP_UPDATE_ACCEPTED: "pwa.app_update.accepted",

  /**
   * Fired when the user dismisses the app-update toast for the
   * session. Non-persistent — the next boot re-checks.
   */
  APP_UPDATE_DISMISSED: "pwa.app_update.dismissed",

  /** Fired when a `check()` completes without an available update. */
  APP_UPDATE_CHECK_UP_TO_DATE: "pwa.app_update.up_to_date",

  /** Fired when a `check()` fails (network error, malformed payload). */
  APP_UPDATE_CHECK_FAILED: "pwa.app_update.check_failed",
} as const;

/** Union of every canonical PWA event name. */
export type PwaEventName = (typeof PWA_EVENTS)[keyof typeof PWA_EVENTS];
