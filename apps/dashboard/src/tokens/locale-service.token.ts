/**
 * @file locale-service.token.ts
 * @module @academorix/dashboard/tokens
 * @description Injection token for {@link LocaleService} — the app-wide
 *   locale controller. Consumers read via `useLocale()` /
 *   `useTranslate()` / `useI18nProvider()`; the service itself owns the
 *   active locale, persists it, and syncs `<html lang dir>`.
 */

/** DI token bound to `LocaleService`. */
export const LOCALE_SERVICE: unique symbol = Symbol("LOCALE_SERVICE");
