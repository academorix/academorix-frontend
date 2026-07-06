/**
 * @file analytics.config.ts
 * @module config/analytics.config
 *
 * @description
 * Analytics providers, event-name registry, and CSP origin whitelists
 * for the marketing app. Kept split into three layers on purpose:
 *
 *  - `analytics`             — provider config (which provider is
 *                              enabled, project keys) with env-var
 *                              overrides so we can flip providers
 *                              per environment without editing code.
 *  - `EVENTS`                — the canonical event-name registry.
 *                              Import from here instead of writing
 *                              string literals so a typo shows up at
 *                              build time, not in the analytics
 *                              dashboard three weeks later.
 *  - `ANALYTICS_CSP_ORIGINS` — origin lists consumed by
 *                              `next.config.ts` when it builds the
 *                              Content-Security-Policy header. Adding
 *                              a new provider means adding its
 *                              origins here; CSP picks them up
 *                              automatically.
 *
 * ## `NEXT_PUBLIC_*` env vars only
 *
 * All env reads use the `NEXT_PUBLIC_` prefix so the values are safely
 * inlined into both server and client bundles. Values without the
 * prefix would resolve to `undefined` in the browser.
 */

/** Analytics provider configuration. Env-driven overrides win. */
export const analytics = {
  /**
   * Vercel Web Analytics. Enabled by default on production Vercel
   * deployments; can be forced off per env with
   * `NEXT_PUBLIC_VERCEL_ANALYTICS=0`.
   */
  vercel: {
    enabled: typeof process !== "undefined" && process.env.NEXT_PUBLIC_VERCEL_ANALYTICS !== "0",
  },

  /**
   * Optional Plausible integration — self-hosted or SaaS. Enabled
   * only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. Left unset in
   * most environments.
   */
  plausible: {
    enabled: typeof process !== "undefined" && Boolean(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
    domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? "",
    scriptSrc: process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_SRC ?? "https://plausible.io/js/script.js",
  },

  /**
   * Optional Google Analytics 4 measurement ID. When set, the layout
   * mounts `next/third-parties`' `<GoogleAnalytics />`.
   */
  ga4: {
    enabled: typeof process !== "undefined" && Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "",
  },
} as const;

/**
 * Canonical event registry. Every named tracking event flows through
 * this map so downstream consumers don't sprinkle magic strings.
 */
export const EVENTS = {
  ctaClick: "cta_click",
  planViewed: "plan_viewed",
  planUpgradeClicked: "plan_upgrade_clicked",
  contactSalesSubmitted: "contact_sales_submitted",
  waitlistSubmitted: "waitlist_submitted",
  languageChanged: "language_changed",
  regionChanged: "region_changed",
  themeChanged: "theme_changed",
  megaMenuOpened: "mega_menu_opened",
  faqExpanded: "faq_expanded",
} as const;

/** Union of every registered event name. */
export type AnalyticsEvent = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * CSP origin whitelists — consumed by `next.config.ts` when it builds
 * the `Content-Security-Policy` response header. Grouped by CSP
 * directive so the header builder can splice each list into the
 * corresponding entry.
 */
export const ANALYTICS_CSP_ORIGINS = {
  /** Origins allowed as `script-src`. */
  script: ["https://*.vercel-scripts.com", "https://vercel.live"] as readonly string[],
  /** Origins allowed as `connect-src` (fetch, XHR, WebSocket). */
  connect: ["https://*.vercel-scripts.com", "https://vercel.live"] as readonly string[],
  /** Origins allowed as `frame-src`. */
  frame: ["https://vercel.live"] as readonly string[],
  /** Origins allowed as `img-src`. */
  img: ["https://vercel.live"] as readonly string[],
} as const;
