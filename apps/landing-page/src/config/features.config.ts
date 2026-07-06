/**
 * @file features.config.ts
 * @module config/features.config
 *
 * @description
 * Compile-time feature flags for the marketing surface. Every flag
 * here is checked at build time (or on first render, for server
 * components), so it costs zero JS on the client. For dynamic
 * per-user flags we'd introduce a runtime service — this file is
 * intentionally the "static" layer.
 *
 * ## Flag lifecycle
 *
 *   1. Add the flag here with a boolean default.
 *   2. Gate the surface with `if (features.foo) { … }`.
 *   3. When the feature stabilises, remove the flag (delete the key
 *      + the guard) — DO NOT let flags accumulate as permanent config.
 */

/**
 * Sports that are advertised in the footer / mega menu with a
 * "Coming soon" badge but don't yet have a landing page. Consumed by
 * `components/landing/footer-section.tsx` when it decorates each
 * sport link with an inline chip.
 */
export const COMING_SOON_SPORTS = ["volleyball", "padel", "athletics"] as const;

/** Union of the coming-soon sport slugs. */
export type ComingSoonSport = (typeof COMING_SOON_SPORTS)[number];

/** Feature flags consumed by page + section code. */
export const features = {
  /**
   * Landing / hero renders a waitlist form instead of the primary
   * "Get started" CTA. Flip to `true` before public launch to convert
   * cold traffic to email captures.
   */
  waitlistMode: false,

  /**
   * `/pricing` fetches plans from the backend catalog API. When
   * `false` (the default) the page renders from
   * `public/data/{locale}/plans.json` fixtures — no network round-trip,
   * no auth needed.
   */
  livePricing: false,

  /** Show the full comparison matrix on `/pricing`. */
  pricingComparison: true,

  /** Advertise the AI Assistant tile inside the Products mega menu. */
  aiAssistant: true,

  /**
   * Show a "New" chip next to the Changelog link in the resources
   * menu and footer. Set to `false` once the launch has quieted.
   */
  showChangelogBadge: true,

  /**
   * Enterprise mega-footer variant. `true` renders the two-row
   * 12-column layout implemented in `components/landing/
   * footer-section.tsx`; a future minimal variant would toggle it off.
   */
  megaFooter: true,

  /**
   * Show the region selector in the footer utility bar. When `false`,
   * the selector hides and every region-scoped page relies on
   * geo-detection alone.
   */
  regionSelector: true,

  /**
   * Auto-detect the visitor's locale from `Accept-Language` and
   * redirect to the matching URL on first visit. Handled by
   * `next-intl`'s middleware — flipping to `false` requires disabling
   * the middleware detection too.
   */
  autoLocaleDetection: true,
} as const;

/** Type-safe key set of the feature flag map. */
export type FeatureFlag = keyof typeof features;

/** Cheap boolean lookup — kept as a function so lint doesn't inline it. */
export function isEnabled(flag: FeatureFlag): boolean {
  return features[flag];
}
