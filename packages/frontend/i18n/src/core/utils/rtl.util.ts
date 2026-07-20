/**
 * @file rtl.util.ts
 * @module @stackra/i18n/core/utils
 * @description RTL/LTR direction detection utility.
 */

import { RTL_LOCALES } from "../constants";

/**
 * Check if a locale uses right-to-left script.
 *
 * @param locale - The locale code to check (e.g., "ar", "ar-SA", "he")
 * @returns `true` if the locale is RTL
 */
export function isRtlLocale(locale: string): boolean {
  if (RTL_LOCALES.has(locale)) return true;
  const base = locale.split("-")[0]!.split("_")[0]!;
  return RTL_LOCALES.has(base);
}

/**
 * Get the text direction for a locale.
 *
 * @param locale - The locale code
 * @returns `"rtl"` or `"ltr"`
 */
export function getDirection(locale: string): "ltr" | "rtl" {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}
