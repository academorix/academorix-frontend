/**
 * @file i18n-provider.ts
 * @module lib/i18n/i18n-provider
 *
 * @description
 * Builds a Refine {@link I18nProvider} over the static {@link MESSAGES} catalogs.
 * `useTranslate`, `useSetLocale`, and `useGetLocale` throughout the app (and
 * inside Refine's own components) resolve against this provider.
 */

import type { Locale } from "@/lib/i18n/i18n.types";
import type { I18nProvider } from "@refinedev/core";

import { MESSAGES } from "@/lib/i18n/messages";

/**
 * Interpolates `{{name}}` placeholders in a message with values from `params`.
 * Unmatched placeholders are left intact.
 */
function interpolate(message: string, params?: Record<string, unknown>): string {
  if (!params) {
    return message;
  }

  return message.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    const value = params[key];

    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Resolves a translation key for a locale.
 *
 * Refine calls `translate` as either `(key, params, defaultMessage)` or the
 * shorthand `(key, defaultMessage)`; both are handled. Resolution order:
 * catalog for the active locale → English catalog → the provided default → the
 * raw key (so nothing ever renders blank).
 */
export function translateMessage(
  locale: Locale,
  key: string,
  optionsOrDefault?: unknown,
  defaultMessage?: string,
): string {
  const params =
    typeof optionsOrDefault === "object" && optionsOrDefault !== null
      ? (optionsOrDefault as Record<string, unknown>)
      : undefined;

  const fallback =
    typeof optionsOrDefault === "string" ? optionsOrDefault : (defaultMessage ?? undefined);

  const message = MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? fallback ?? key;

  return interpolate(message, params);
}

/**
 * Creates a Refine {@link I18nProvider} bound to the current `locale` and a
 * `changeLocale` callback (wired to the {@link "@/lib/i18n/locale-context"}
 * state). Recreated whenever the locale changes so `getLocale`/`translate`
 * always reflect the active language.
 *
 * @param locale - The currently active locale.
 * @param changeLocale - Callback invoked when Refine requests a locale change.
 */
export function createI18nProvider(
  locale: Locale,
  changeLocale: (next: Locale) => void,
): I18nProvider {
  return {
    translate: (key, options, defaultMessage) =>
      translateMessage(locale, key, options, defaultMessage),
    changeLocale: (next) => {
      changeLocale(next as Locale);

      return Promise.resolve();
    },
    getLocale: () => locale,
  };
}
