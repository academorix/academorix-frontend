/**
 * @file define-i18n.util.ts
 * @module @academorix/i18n/config/define-i18n.util
 *
 * @description
 * `defineI18nConfig` — the typed passthrough that ties an app's i18n
 * literal to {@link I18nConfig<TLocale>} and freezes the result.
 *
 * Same shape as `@academorix/core/config/defineConfig`, specialized so
 * the generic `TLocale` gets inferred from the caller's `locales`
 * tuple. That inference is what makes every downstream primitive
 * (predicates, provider, hook) type-safe.
 */

import type { I18nConfig } from "./i18n-config.type";

/**
 * Ties an app's i18n literal to {@link I18nConfig<TLocale>} and freezes
 * the result. Zero runtime cost beyond `Object.freeze`.
 *
 * @typeParam TLocale - Inferred from the caller's `locales` tuple.
 *
 * @example
 * ```ts
 * // apps/dashboard/src/config/i18n.config.ts
 * import { defineI18nConfig } from "@academorix/i18n/config";
 *
 * export const LOCALES = ["en", "ar"] as const;
 * export type Locale = (typeof LOCALES)[number];
 *
 * export const i18nConfig = defineI18nConfig({
 *   locales: LOCALES,
 *   defaultLocale: "en",
 *   rtlLocales: ["ar"],
 *   labels: { en: "English", ar: "العربية" },
 *   bcp47: { en: "en-US", ar: "ar-EG" },
 *   storageKey: "academorix.locale",
 *   timeZone: "UTC",
 *   currencyByLocale: { en: "USD", ar: "USD" },
 * });
 * ```
 */
export function defineI18nConfig<TLocale extends string>(
  config: I18nConfig<TLocale>,
): Readonly<I18nConfig<TLocale>> {
  return Object.freeze(config);
}
