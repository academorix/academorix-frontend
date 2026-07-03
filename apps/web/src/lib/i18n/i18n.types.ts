/**
 * @file i18n.types.ts
 * @module lib/i18n/i18n.types
 *
 * @description
 * Core i18n types: the supported {@link Locale}s, their display labels, which
 * are right-to-left, and the shape of a message catalog. Catalogs are flat
 * dot-keyed maps (e.g. `"buttons.create"`) so lookups are a simple index.
 */

/** Locales the app ships translations for. */
export const LOCALES = ["en", "ar"] as const;

/** A single supported locale (e.g. `"en"`). */
export type Locale = (typeof LOCALES)[number];

/** Native display label for each locale (shown in the language switcher). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

/** Locales rendered right-to-left; drives the document `dir` attribute. */
export const RTL_LOCALES: readonly Locale[] = ["ar"];

/** Whether a locale is right-to-left. */
export function isRtlLocale(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * A message catalog: a flat map of dot-keyed message ids to translated strings.
 * Keys mirror Refine's translation namespace (`buttons.*`, `pages.error.*`, …)
 * plus an app-specific `app.*` namespace.
 */
export type MessageCatalog = Record<string, string>;
