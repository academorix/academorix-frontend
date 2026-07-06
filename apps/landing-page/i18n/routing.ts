/**
 * @file routing.ts
 * @module i18n/routing
 *
 * @description
 * Central `next-intl` routing configuration. Declares the supported locales,
 * the default fallback, the URL-prefix policy, and locale-scoped `pathnames`
 * (populated later if we localise slugs — Arabic slugs, etc.).
 *
 * ## Prefix policy
 *
 * `localePrefix: "as-needed"` keeps the English URLs bare (`/pricing`,
 * `/products/athletes`) while Arabic gets a `/ar/*` prefix. Search engines
 * and shareable links stay short for the default audience; non-default
 * locales are explicit.
 *
 * The middleware, request loader, and typed navigation wrappers all read
 * from this single source of truth so adding a locale is a one-line change
 * plus a new `messages/{locale}.json`.
 */

import { defineRouting } from "next-intl/routing";

/**
 * Every locale the marketing site supports. `en` is the default; `ar`
 * ships with RTL layout + Arabic UI chrome.
 */
export const LOCALES = ["en", "ar"] as const;

/** Union of every supported locale code — narrower than `string`. */
export type Locale = (typeof LOCALES)[number];

/** The right-to-left locales — used to set `<html dir="rtl">`. */
export const RTL_LOCALES: readonly Locale[] = ["ar"] as const;

/** True when the given locale should render right-to-left. */
export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/**
 * Human-readable label for each supported locale — used by the language
 * switcher dropdown. Kept out of the message catalogues on purpose so the
 * label of each locale reads in its own script no matter which locale the
 * UI is currently rendered in.
 */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ar: "العربية",
};

/**
 * `next-intl` routing config. Consumed by `middleware.ts`, the typed
 * navigation wrappers (`i18n/navigation.ts`), and the request-time
 * message loader (`i18n/request.ts`).
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: "en",
  /** English routes stay unprefixed; every other locale gets `/{code}/*`. */
  localePrefix: "as-needed",
  /**
   * Cookie name used to remember the visitor's chosen locale across
   * requests. `NEXT_LOCALE` is the `next-intl` default — kept explicit
   * so the language switcher can clear/set it directly if we ever need
   * to bypass the middleware.
   */
  localeCookie: {
    name: "NEXT_LOCALE",
    // 1 year — matches Vercel's recommended cookie lifetime for locale.
    maxAge: 60 * 60 * 24 * 365,
  },
});
