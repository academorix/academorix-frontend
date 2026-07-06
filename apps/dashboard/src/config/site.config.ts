/**
 * @file site.config.ts
 * @module config/site.config
 *
 * @description
 * Composes the strongly-typed environment snapshot ({@link envConfig}) into a
 * consumer-friendly shape ({@link siteConfig}) that call sites across the app
 * read from — document title, API base URL, realtime credentials, outbound
 * marketing links, etc. Every value here is derived; nothing is duplicated.
 */

import { envConfig } from "@/config/env.config";

/** Aggregate site configuration surface. Frozen so accidental mutation throws. */
export const siteConfig = Object.freeze({
  /** Human-readable product name. Rendered in `<title>` and the app shell. */
  name: envConfig.appName,
  /** Deployment tier — drives dev-only conveniences (extra logging, mocks). */
  environment: envConfig.appEnv,
  /** One-line tagline used on empty states and marketing embeds. */
  description: "The operating system for modern academies.",

  /** REST API access. */
  api: Object.freeze({
    baseUrl: envConfig.apiUrl,
  }),

  /** Reverb (Laravel Echo) realtime config. */
  realtime: envConfig.reverb,

  /** Curated external links. */
  links: Object.freeze({
    github: "https://github.com/academorix",
    /** Public marketing site (apps/landing-page). Used by outbound CTAs. */
    marketing: envConfig.marketingUrl,
    /** Deep-link into the marketing pricing catalog. */
    marketingPricing: `${envConfig.marketingUrl}/pricing`,
  }),
} as const);

export type SiteConfig = typeof siteConfig;
