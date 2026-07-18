/**
 * @file index.ts
 * @module @academorix/i18n
 *
 * @description
 * Public root barrel for the i18n package. Prefer subpath imports
 * for optimal tree-shaking; the root barrel exists for convenience.
 *
 * ## Public API
 *
 *  - {@link "@academorix/i18n/config"} — `defineI18nConfig`, `I18nConfig<T>` type.
 *  - {@link "@academorix/i18n/context"} — `createLocaleContext<T>()` factory,
 *    returning `{ LocaleProvider, useLocale, isSupportedLocale, isRtlLocale, resolveLocale }`.
 *  - {@link "@academorix/i18n/format"} — `formatDate`, `formatNumber`,
 *    `formatCurrency`, `formatRelativeTime`, `formatList`.
 *  - {@link "@academorix/i18n/messages"} — `MessageCatalog` type,
 *    `interpolate(message, params)`.
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
 * });
 *
 * // apps/dashboard/src/lib/i18n/locale-context.ts
 * import { createLocaleContext } from "@academorix/i18n/context";
 * import { i18nConfig, type Locale } from "@/config/i18n.config";
 *
 * export const { LocaleProvider, useLocale, isRtlLocale } =
 *   createLocaleContext<Locale>(i18nConfig);
 * ```
 */

export { defineI18nConfig } from "./config";
export type { I18nConfig } from "./config";

export { createLocaleContext } from "./context";
export type { LocaleContextBundle, LocaleContextValue, LocaleProviderProps } from "./context";

export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatRelativeTime,
} from "./format";
export type { DateInput, FormatDateOptions } from "./format";

export { interpolate } from "./messages";
export type { MessageCatalog } from "./messages";
