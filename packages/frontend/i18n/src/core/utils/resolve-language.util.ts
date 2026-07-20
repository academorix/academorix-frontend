/**
 * @file resolve-language.util.ts
 * @module @stackra/i18n/core/utils
 * @description Language resolution with fallback chains and wildcard support.
 */

import type { I18nFallbacks } from "../interfaces";

/**
 * Resolve a language code through the fallback map and supported locales.
 *
 * Resolution order:
 * 1. Exact match in supported locales → use as-is
 * 2. Fallback map match (exact or wildcard) → use mapped locale
 * 3. Base language match (e.g., "en-US" → "en") → use base
 * 4. Default fallback locale
 *
 * @param lang - The requested language code
 * @param supportedLocales - Array of supported locale codes
 * @param fallbacks - Optional fallback mapping
 * @returns The resolved language code
 */
export function resolveLanguage(
  lang: string,
  supportedLocales: string[],
  fallbacks?: I18nFallbacks,
): string {
  // Direct support check
  if (supportedLocales.includes(lang)) {
    return lang;
  }

  // Check fallback map
  if (fallbacks) {
    // Exact match in fallbacks
    if (fallbacks[lang]) {
      return fallbacks[lang];
    }

    // Wildcard match (e.g., "ar-*" matches "ar-SA")
    const base = lang.includes("-") ? lang.split("-")[0] : lang;
    const wildcardKey = `${base}-*`;
    if (fallbacks[wildcardKey]) {
      return fallbacks[wildcardKey];
    }
  }

  // Base language fallback (e.g., "en-US" → "en")
  if (lang.includes("-")) {
    const base = lang.split("-")[0]!;
    if (supportedLocales.includes(base)) {
      return base;
    }
  }

  return lang;
}

/**
 * Get the next fallback language in the chain.
 *
 * Resolution: if current lang has a region (e.g., "en-US"), try base ("en").
 * Otherwise, return the default fallback.
 *
 * @param lang - The current language code
 * @param defaultLocale - The configured default locale
 * @returns The next fallback language to try
 */
export function getNextFallbackLanguage(lang: string, defaultLocale: string): string {
  // Try stripping region
  if (lang.includes("-")) {
    return lang.split("-")[0]!;
  }
  if (lang.includes("_")) {
    return lang.split("_")[0]!;
  }

  return defaultLocale;
}
