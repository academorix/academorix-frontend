/**
 * @file index.ts
 * @module lib/i18n
 *
 * @description
 * Public barrel for the i18n runtime layer: the {@link LocaleProvider}
 * React component and the two hooks that read the active locale
 * ({@link useLocale}) and the derived Refine i18n provider
 * ({@link useI18nProvider}).
 *
 * **Types + primitives + predicates live in {@link "@/config/i18n.config"}
 * and MUST be imported from there directly** — this barrel intentionally
 * does not re-export them, so build-time consumers (Vite config, PWA
 * manifest generator, Playwright fixtures) never accidentally pull in
 * the React runtime.
 *
 * @example Runtime consumers
 * ```tsx
 * import { LocaleProvider, useLocale } from "@/lib/i18n";
 * ```
 *
 * @example Type / predicate consumers
 * ```ts
 * import type { Locale } from "@/config/i18n.config";
 * import { LOCALES, LOCALE_LABELS, isRtlLocale } from "@/config/i18n.config";
 * ```
 */

export { LocaleProvider, useLocale, useI18nProvider } from "@/lib/i18n/locale-context";
