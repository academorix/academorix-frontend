/**
 * @file i18n.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/i18n` on the shared
 *   `EVENT_EMITTER` bus.
 *
 *   The names live in contracts so cross-package consumers (analytics,
 *   monitoring, scope-aware caches, devtools) can subscribe without
 *   depending on the `@stackra/i18n` runtime.
 */

/**
 * i18n lifecycle event names — emitted on the optional `EVENT_EMITTER`
 * bus (`@stackra/contracts`) when one is configured.
 */
export const I18N_EVENTS = {
  /** The active locale changed. */
  LOCALE_CHANGED: "i18n.locale.changed",
  /** Translations for a locale finished loading. */
  TRANSLATIONS_LOADED: "i18n.translations.loaded",
  /** A translation key was missing in the active locale. */
  MISSING_KEY: "i18n.missing.key",
} as const;

/** Union of i18n event name string literals. */
export type I18nEventName = (typeof I18N_EVENTS)[keyof typeof I18N_EVENTS];
