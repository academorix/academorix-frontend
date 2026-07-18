/**
 * @file config.ts
 * @module i18n/config
 *
 * @description
 * Single source of truth for every locale-related constant. Referenced by the
 * runtime provider, the language switcher, and any Playwright a11y suite.
 */

/** Every supported locale, in language-switcher display order. */
export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

/** Fallback locale (used when a key is missing in the active catalog). */
export const DEFAULT_LOCALE: Locale = "en";

/** Locales rendered right-to-left. Drives `<html dir="rtl">`. */
export const RTL_LOCALES: readonly Locale[] = ["ar"] as const;

/** Native-script labels used by the language switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
};

/** Iconify flag tokens (Iconify `flag:*` set). */
export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "flag:us-4x3",
  ar: "flag:sa-4x3",
};

/** BCP-47 tag per locale — used by `Intl.*` formatters and `<html lang>`. */
export const LOCALE_BCP47: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-EG",
};

/** localStorage key. */
export const LOCALE_STORAGE_KEY = "academorix.locale";

/** True when the locale renders right-to-left. */
export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/** Narrowing predicate. */
export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
