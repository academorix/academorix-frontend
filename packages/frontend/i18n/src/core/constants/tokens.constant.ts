/**
 * @file tokens.constant.ts
 * @module @stackra/i18n/core/constants
 * @description Package-local DI token for the i18n runtime.
 *
 *   Cross-package i18n tokens (`I18N_MANAGER`, `I18N_LOCALE_SERVICE`,
 *   `I18N_DIRECTION_SERVICE`, `I18N_DIRECTION_ADAPTER`,
 *   `I18N_LOCALE_STORAGE`, `I18N_TRANSLATION_PROVIDER`) and the
 *   `I18N_EVENTS` map live in `@stackra/contracts`. Import them from
 *   there directly.
 *
 *   Only `I18N_CONFIG` stays local — it's module-internal (only
 *   `I18nModule` provides it, only i18n services read it), mirroring
 *   `QUERY_CONFIG` and other module-config tokens.
 */

/** Token for the merged i18n module configuration provided by `I18nModule`. */
export const I18N_CONFIG = Symbol.for("I18N_CONFIG");
