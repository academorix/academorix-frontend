/**
 * @file index.ts
 * @module lib/i18n
 *
 * @description
 * Public barrel for the i18n layer: locale types/labels, the RTL helper, the
 * {@link LocaleProvider}, and the `useLocale` / `useI18nProvider` hooks.
 *
 * @example
 * ```tsx
 * import { LocaleProvider, useLocale, LOCALE_LABELS } from "@/lib/i18n";
 * ```
 */

export * from "@/lib/i18n/i18n.types";
export { LocaleProvider, useLocale, useI18nProvider } from "@/lib/i18n/locale-context";
