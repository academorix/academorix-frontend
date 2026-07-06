/**
 * @file social-proof.config.ts
 * @module config/social-proof.config
 *
 * @description
 * Marketing-owned social-proof surfaces — logo cloud, testimonials,
 * press mentions, stat counters. Kept structural so a marketing edit
 * (new logo, new quote) is a one-file change with no code churn.
 *
 * ## Where testimonials come from
 *
 * Product + sport deep pages (`/products/*`, `/sports/*`) already
 * carry their own inline `use_case` / `testimonial` blocks inside
 * `public/data/{locale}/products.json` + `sports.json`. The entries
 * here are the CROSS-SURFACE ones — logos on the hero strip, quotes
 * on `/customers`, and press hits used site-wide.
 *
 * ## Populating the registries
 *
 * Every entry requires a signed release from the source (customer +
 * publication). Until we've collected the paperwork, the arrays stay
 * empty — code consumers must handle the empty state gracefully.
 */

/** A single brand in the "trusted by" logo cloud. */
export interface LogoEntry {
  /** Display name (also used for the `alt` attribute). */
  name: string;
  /** Path under `public/` to the SVG/PNG mark. */
  src: string;
  /** Optional link to the customer story. */
  href?: string;
  /** Optional native width — used for the intrinsic aspect ratio. */
  width?: number;
  /** Optional native height. */
  height?: number;
}

/** A customer / operator testimonial. */
export interface TestimonialEntry {
  /** Short quote (< 240 chars for readability). */
  quote: string;
  /** Attribution — human name. */
  author: string;
  /** Role at the organization. */
  role: string;
  /** Organization name. */
  organization: string;
  /** 2-letter initials for the avatar. */
  initials: string;
  /** Optional slug pointing at `/customers/{slug}`. */
  storySlug?: string;
}

/** A press mention (magazine / podcast / blog). */
export interface PressEntry {
  /** Publication name. */
  outlet: string;
  /** Short blurb / pull quote. */
  quote: string;
  /** Absolute URL to the article. */
  href: string;
  /** Publication date (ISO-8601). */
  publishedAt: string;
}

/** A hero-strip stat counter. */
export interface StatEntry {
  /** Big value ("10k+", "99.99%"). */
  value: string;
  /** Short label ("athletes managed"). */
  label: string;
}

/**
 * Social-proof registries. Populate as we collect signed permissions.
 * Consumers must accept the empty state — the hero strip should hide
 * itself when `logos.length === 0`.
 */
export const socialProof = {
  logos: [] as readonly LogoEntry[],
  testimonials: [] as readonly TestimonialEntry[],
  press: [] as readonly PressEntry[],
  stats: [] as readonly StatEntry[],
} as const;
