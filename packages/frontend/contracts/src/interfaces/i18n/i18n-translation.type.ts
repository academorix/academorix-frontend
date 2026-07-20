/**
 * @file i18n-translation.type.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Shape of a translations record for a single locale — either a
 *   plain string, a nested translations object, or a CLDR plural object.
 *
 *   Lives in contracts so cross-package consumers (`@stackra/i18n`,
 *   `@stackra/http`, `@stackra/ai`, …) type against a single source of truth.
 */

/**
 * Translations for one locale, keyed by (possibly nested) message key.
 *
 * Values are strings or further nested translation records (which may in
 * turn hold arrays or CLDR plural objects). The engine walks the nested
 * structure via the configured key separator.
 */
export type I18nTranslation = Record<string, string | Record<string, unknown>>;
