/**
 * @file index.ts
 * @module config
 *
 * @description
 * Barrel re-export for the marketing app's declarative configs. Every
 * `*.config.ts` in this folder exposes at least one named object; this
 * barrel forwards them so consumers can do:
 *
 * ```ts
 * import { site, seo, features, pricing } from "@/config";
 * ```
 *
 * ## What lives here vs. `lib/`
 *
 *  - `config/*` — STATIC values evaluated at build time. Safe to
 *    import from `next.config.ts`, layouts, sitemap, and robots.
 *  - `lib/*`    — RUNTIME helpers (env resolvers, API readers,
 *    mutators). Not safe to import from `next.config.ts` because they
 *    read env vars at REQUEST time rather than build time.
 *
 * If a value depends on `process.env` at REQUEST time (not build
 * time), put the resolver in `lib/env.ts` — the value belongs in
 * `lib`, not `config`.
 *
 * ## Wildcards intentionally avoided
 *
 * The barrel uses explicit named re-exports rather than `export *`
 * so:
 *
 *   1. Tree-shaking is predictable regardless of the bundler's
 *      handling of `export *`.
 *   2. Knip / dead-code detection can see every re-exported symbol.
 *   3. Grepping for a name always finds its canonical file.
 */

export { analytics, ANALYTICS_CSP_ORIGINS, EVENTS } from "./analytics.config";
export type { AnalyticsEvent } from "./analytics.config";

export { contact, mailto } from "./contact.config";

export { COMING_SOON_SPORTS, features, isEnabled } from "./features.config";
export type { ComingSoonSport, FeatureFlag } from "./features.config";

export { fontMono, fonts, fontSans } from "./fonts.config";

export {
  CURRENCY_BY_LOCALE,
  DEFAULT_LOCALE,
  DEFAULT_TIME_ZONE,
  i18n,
  isRtlLocale,
  isSupportedLocale,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_LABELS,
  LOCALE_PREFIX,
  LOCALES,
  RTL_LOCALES,
} from "./i18n.config";
export type { Locale } from "./i18n.config";

export { legal } from "./legal.config";
export type { Jurisdiction, LegalDocSlug } from "./legal.config";

export { FOOTER_COLUMN_KEYS, HEADER_ENTRY_KEYS, nav, NAV_ANCHORS, NAV_LAYOUT } from "./nav.config";
export type { FooterColumnKey } from "./nav.config";

export {
  ANNUAL_MONTHS_FREE,
  BILLING_PERIODS,
  buildPlanJsonLd,
  DEFAULT_CURRENCY,
  PLAN_KEYS,
  pricing,
} from "./pricing.config";

export {
  LEGACY_REDIRECTS,
  MARKETING_ROUTES,
  NON_INDEXED_PATHS,
  routes,
  STATIC_SITEMAP_ROUTES,
} from "./routes.config";
export type {
  LegacyRedirect,
  MarketingRouteKey,
  MarketingRoutePath,
  StaticSitemapEntry,
} from "./routes.config";

export {
  buildBreadcrumbJsonLd,
  DEFAULT_OG_IMAGE_PATH,
  FALLBACK_OG_IMAGE_PATH,
  REMOTE_IMAGE_PATTERNS,
  SEO_KEYWORDS,
  seo,
  TWITTER_HANDLE,
  verification,
} from "./seo.config";
export type { Crumb } from "./seo.config";

export {
  BRAND_COLORS,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  DOMAINS,
  site,
} from "./site.config";

export { socialProof } from "./social-proof.config";
export type { LogoEntry, PressEntry, StatEntry, TestimonialEntry } from "./social-proof.config";
