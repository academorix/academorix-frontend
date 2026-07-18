/**
 * @file i18n-provider.ts
 * @module i18n/i18n-provider
 *
 * @description
 * Builds a Refine {@link I18nProvider} bound to the active locale. Also
 * exports the {@link MessageCatalog} type and a {@link translateMessage}
 * helper reused by any component that needs to translate outside a Refine
 * hook (e.g. the command palette + shortcut sheet at module scope).
 */

import type { Locale } from "@/i18n/config";
import type { I18nProvider } from "@refinedev/core";

/** A flat map of dot-keyed message ids to translated strings. */
export type MessageCatalog = Record<string, string>;

/** Interpolate `{{name}}` and `{name}` placeholders. Unmatched keys stay intact. */
function interpolate(message: string, params?: Record<string, unknown>): string {
  if (!params) return message;

  return message.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (match, key: string) => {
    const value = params[key];

    return value === undefined || value === null ? match : String(value);
  });
}

/** Translate a key against a catalog map (locale → English fallback → default → key). */
export function translateMessage(
  catalogs: Record<Locale, MessageCatalog>,
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

  const message = catalogs[locale]?.[key] ?? catalogs.en?.[key] ?? fallback ?? key;

  return interpolate(message, params);
}

/** Factory: build a Refine i18n provider bound to the current locale + setter. */
export function createI18nProvider(
  catalogs: Record<Locale, MessageCatalog>,
  locale: Locale,
  changeLocale: (next: Locale) => void,
): I18nProvider {
  return {
    translate: (key, options, defaultMessage) =>
      translateMessage(catalogs, locale, key, options, defaultMessage),
    changeLocale: (next) => {
      changeLocale(next as Locale);

      return Promise.resolve();
    },
    getLocale: () => locale,
  };
}
