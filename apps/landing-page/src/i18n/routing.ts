/**
 * @file routing.ts
 * @module i18n/routing
 *
 * @description
 * Thin adapter that turns the locale primitives from
 * `@/config/i18n.config` into the `next-intl` `routing` object.
 * Re-exports the primitives so existing consumers (`@/i18n/routing`)
 * keep working without an import-path change.
 *
 * ## Prefix policy
 *
 * `LOCALE_PREFIX === "as-needed"` keeps the English URLs bare
 * (`/pricing`, `/products/athletes`) while Arabic gets a `/ar/*`
 * prefix. Search engines and shareable links stay short for the
 * default audience; non-default locales are explicit.
 */

import { defineRouting } from "next-intl/routing";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_PREFIX,
  LOCALES,
} from "@/config/i18n.config";

// Re-export the locale primitives so existing `@/i18n/routing`
// imports keep resolving. New code should prefer `@/config/i18n.config`
// (or the `@/config` barrel) directly.
export {
  DEFAULT_LOCALE,
  isRtlLocale,
  isSupportedLocale,
  LOCALE_BCP47_TAGS,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_LABELS,
  LOCALES,
  resolveLocale,
  RTL_LOCALES,
} from "@/config/i18n.config";
export type { Locale } from "@/config/i18n.config";

/**
 * `next-intl` routing config. Consumed by `middleware.ts`, the typed
 * navigation wrappers (`i18n/navigation.ts`), and the request-time
 * message loader (`i18n/request.ts`).
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: LOCALE_PREFIX,
  localeCookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE,
  },
});
