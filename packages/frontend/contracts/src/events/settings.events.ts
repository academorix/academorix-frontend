/**
 * @file settings.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/settings` on the
 *   `EVENT_EMITTER` bus.
 *
 *   Constants live in contracts so cross-package consumers
 *   (analytics, sdui runtime, admin dashboards) can subscribe
 *   without depending on the settings runtime.
 *
 *   The corresponding realtime broadcast contracts (Laravel Spatie
 *   channels — `settings.{group}`, private tenant variants) travel
 *   under their own event names on the wire; the constants here are
 *   for the LOCAL event-emitter bus only.
 */

/**
 * Settings lifecycle event names.
 */
export const SETTINGS_EVENTS = {
  /**
   * A group's values changed — either locally (via `set*` / `reset`)
   * or from an inbound realtime broadcast that has been merged into
   * the local cache. Payload: `{ group: string; keys: string[];
   * values: Record<string, unknown>; source: 'local' | 'remote' }`.
   */
  CHANGED: "settings.changed",

  /**
   * A group was reset back to defaults. Payload: `{ group: string }`.
   */
  GROUP_RESET: "settings.group-reset",

  /**
   * The remote schema was fetched and every group registered.
   * Payload: `{ count: number }`.
   */
  SCHEMA_LOADED: "settings.schema-loaded",

  /**
   * An update request could not be persisted. Payload:
   * `{ group: string; error: Error; keys: string[] }`. Fired by the
   * service after retry policy has been exhausted.
   */
  UPDATE_FAILED: "settings.update-failed",
} as const;

/** Union type of every emitted settings event name. */
export type SettingsEventName = (typeof SETTINGS_EVENTS)[keyof typeof SETTINGS_EVENTS];
