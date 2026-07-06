/**
 * @file nav.config.ts
 * @module config/nav.config
 *
 * @description
 * Structural constants for the header + footer navigation. The actual
 * per-locale copy + links live in `public/data/{locale}/nav.json` —
 * this file owns the STATIC scaffold that surrounds those data-driven
 * parts: column key ordering, sticky-header offsets, mobile
 * breakpoint tokens, and the canonical set of footer column slugs.
 *
 * Anything that lives here can be referenced from every locale
 * (English, Arabic, and any future language) without changing.
 */

/** Every footer column key, in render order. */
export const FOOTER_COLUMN_KEYS = [
  // Row 1 — product-facing.
  "products",
  "sports",
  "solutions",
  "enterprise",
  "personas",
  "regions",
  // Row 2 — company + resources + legal.
  "build",
  "learn",
  "explore",
  "company",
  "trust",
  "social",
] as const;

/** Union of every footer column key. */
export type FooterColumnKey = (typeof FOOTER_COLUMN_KEYS)[number];

/** Header top-level entry keys (mirrored from `nav.json`). */
export const HEADER_ENTRY_KEYS = [
  "products",
  "sports",
  "resources",
  "enterprise",
  "pricing",
] as const;

/** Layout tokens the header + drawer share. */
export const NAV_LAYOUT = {
  /** Sticky-header height (px). Match with Tailwind `h-16`. */
  headerHeightPx: 64,
  /** Landing-page max width (px). Match with `max-w-[1400px]`. */
  containerMaxWidthPx: 1400,
  /**
   * Below this width, the desktop mega menu collapses to a drawer.
   * Match with Tailwind's `lg:` breakpoint.
   */
  desktopBreakpointPx: 1024,
} as const;

/**
 * In-page anchor hrefs used by the "Features / Sports / How it works"
 * scroll-to links in the top nav. Reflect the section IDs rendered by
 * `components/landing/*-section.tsx`.
 */
export const NAV_ANCHORS = {
  features: "#features",
  sports: "#sports",
  howItWorks: "#how-it-works",
  pricing: "#pricing",
} as const;

/** Aggregate handle for barrel consumers. */
export const nav = {
  footerColumnKeys: FOOTER_COLUMN_KEYS,
  headerEntryKeys: HEADER_ENTRY_KEYS,
  layout: NAV_LAYOUT,
  anchors: NAV_ANCHORS,
} as const;
