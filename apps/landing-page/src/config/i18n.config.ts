/**
 * @file i18n.config.ts
 * @module config/i18n.config
 *
 * @description
 * Single source of truth for every locale-related constant in the
 * marketing app. Consumed by:
 *
 *  - `i18n/routing.ts` — feeds `defineRouting()` and re-exports the
 *    type surface (`Locale`, `LOCALES`, …) so existing call sites
 *    stay stable.
 *  - `i18n/request.ts` — falls back to `DEFAULT_LOCALE` when a request
 *    arrives without a valid locale segment.
 *  - `middleware.ts` (indirectly, through `routing.ts`) — locale
 *    prefix detection, cookie writes, hreflang alternates.
 *  - `lib/api/read.ts` — fallback catalog when a fixture hasn't been
 *    translated yet.
 *  - `app/[locale]/layout.tsx` — `<html dir>` + `alternates.languages`.
 *
 * ## Adding a locale
 *
 *   1. Append the ISO code to {@link LOCALES}.
 *   2. Add its native-script label to {@link LOCALE_LABELS}.
 *   3. If it renders right-to-left, add it to {@link RTL_LOCALES}.
 *   4. Ship a `messages/{code}.json`.
 *   5. Optionally ship `public/data/{code}/*.json` — anything missing
 *      transparently falls back to {@link DEFAULT_LOCALE}.
 *
 * ## Why the primitives live here, not in `i18n/routing.ts`
 *
 * `next.config.ts` and other build-time surfaces need to read locales
 * without pulling in `next-intl`. Splitting the pure constants into
 * this config file keeps the dependency graph shallow.
 */

/** Every locale the marketing site supports. Order defines the switcher UI. */
export const LOCALES = ["en", "ar"] as const;

/** Union of every supported locale code — narrower than `string`. */
export type Locale = (typeof LOCALES)[number];

/** The default locale — URLs stay unprefixed, fixtures fall back here. */
export const DEFAULT_LOCALE: Locale = "en";

/** Locales that should render right-to-left. Consumed by `<html dir>`. */
export const RTL_LOCALES: readonly Locale[] = ["ar"] as const;

/**
 * Human-readable label for each supported locale — always in its own
 * script so the language switcher reads correctly regardless of the
 * current UI language.
 */
export const LOCALE_LABELS: Readonly<Record<Locale, string>> = {
  en: "English",
  ar: "العربية",
};

/** Cookie next-intl writes when a visitor switches languages. */
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

/** 1 year in seconds — Vercel-recommended lifetime for locale cookies. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * `localePrefix` policy — "as-needed" keeps English bare and prefixes
 * every other locale. Kept here so a single change flips policy across
 * the middleware, sitemap, robots, and typed navigation wrappers.
 */
export const LOCALE_PREFIX = "as-needed" as const;

/** Canonical timezone for date/time formatters when no user pref is set. */
export const DEFAULT_TIME_ZONE = "UTC";

/**
 * Currency displayed for prices per locale. USD is a deliberate choice
 * for both English and Arabic surfaces — the pricing fixtures declare
 * their amounts in USD and localise only the CTA copy. Regional
 * pricing pages (`/regions/localised-invoicing`) call out local-VAT
 * currency support separately.
 */
export const CURRENCY_BY_LOCALE: Readonly<Record<Locale, string>> = {
  en: "USD",
  ar: "USD",
};

/** True when the locale should render right-to-left. */
export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

/** Type-narrowing predicate — true when `value` is a supported locale. */
export function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * Aggregate i18n config used by the barrel. Prefer named imports of
 * the primitive constants at call sites; this shape exists for
 * consumers that want a single `i18n.locales` handle.
 */
export const i18n = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  rtlLocales: RTL_LOCALES,
  localeLabels: LOCALE_LABELS,
  localePrefix: LOCALE_PREFIX,
  cookie: {
    name: LOCALE_COOKIE_NAME,
    maxAge: LOCALE_COOKIE_MAX_AGE,
  },
  timeZone: DEFAULT_TIME_ZONE,
  currencyByLocale: CURRENCY_BY_LOCALE,
} as const;
