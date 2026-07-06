/**
 * @file site.config.ts
 * @module config/site.config
 *
 * @description
 * Locale-agnostic brand metadata. The per-locale STRINGS (tagline,
 * description, translated CTAs) still live in
 * `public/data/{locale}/site.json` because they change per language;
 * this file owns everything that DOES NOT translate: canonical
 * domains, brand color tokens, socials, organization schema fields.
 *
 * ## Consumers
 *
 *  - `app/[locale]/layout.tsx`   — `<meta theme-color>`, `metadataBase`,
 *                                  OG defaults, JSON-LD Organization.
 *  - `app/sitemap.ts` / `robots.ts` — canonical base URL host.
 *  - `config/seo.config.ts`      — builds SEO defaults on top of this.
 *  - `next.config.ts`            — image `remotePatterns` derived from
 *                                  {@link DOMAINS}.
 *
 * ## Why not merge with `site.json`?
 *
 * `site.json` is per-locale and read at request time. This file is
 * evaluated at build time and safe to import from anywhere (including
 * `next.config.ts`). Keeping the two apart keeps the runtime bundle
 * lean and makes the build-time inputs statically discoverable.
 */

/** The set of hostnames Academorix operates on. */
export const DOMAINS = {
  marketing: "academorix.com",
  app: "app.academorix.app",
  docs: "docs.academorix.com",
  status: "status.academorix.com",
} as const;

/** Canonical marketing brand palette. Kept in sync with Tailwind theme. */
export const BRAND_COLORS = {
  /** Light-mode theme color — matches `<meta name="theme-color">`. */
  light: "#0EA5E9",
  /** Dark-mode theme color — used for address-bar tint in dark UI. */
  dark: "#0369A1",
} as const;

/** Locale-agnostic site metadata. */
export const site = {
  /** Product / brand name. */
  name: "Academorix",

  /**
   * Fallback tagline. The real per-locale copy comes from `site.json`;
   * this value is used in JSON-LD + OG image defaults where a locale
   * hasn't been resolved yet.
   */
  fallbackTagline: "The multi-sport academy OS",

  /** Canonical short description used in JSON-LD Organization. */
  fallbackDescription:
    "Academorix — the operating system for modern academies. Manage athletes, teams, sessions, matches, payments, and safeguarding from one place.",

  /** Domains the brand owns. */
  domains: DOMAINS,

  /** Brand color palette. */
  colors: BRAND_COLORS,

  /** Public socials — absolute so consumers don't rebuild URLs. */
  socials: {
    github: "https://github.com/academorix",
    x: "https://twitter.com/academorix",
    linkedin: null as string | null,
    community: "https://academorix.com/community",
  },

  /** Structured Organization metadata for JSON-LD. */
  organization: {
    legalName: "Academorix Ltd",
    foundedYear: 2025,
    /** 512×512 raster referenced by the Organization logo field. */
    logoPath: "/pwa-512x512.png",
    /** Master vector used by the SVG favicon + Safari pinned tab. */
    faviconPath: "/favicon.svg",
  },
} as const;

/**
 * Builds the JSON-LD Organization schema for the marketing site.
 * Injected by the root layout as
 * `<script type="application/ld+json">`.
 *
 * @param baseUrl - Canonical marketing origin (no trailing slash).
 */
export function buildOrganizationJsonLd(baseUrl: string): Record<string, unknown> {
  const sameAs: string[] = [];

  if (site.socials.github) sameAs.push(site.socials.github);
  if (site.socials.x) sameAs.push(site.socials.x);
  if (site.socials.linkedin) sameAs.push(site.socials.linkedin);
  if (site.socials.community) sameAs.push(site.socials.community);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    legalName: site.organization.legalName,
    url: baseUrl,
    logo: `${baseUrl}${site.organization.logoPath}`,
    foundingDate: `${site.organization.foundedYear}-01-01`,
    sameAs,
    description: site.fallbackDescription,
  };
}

/**
 * Builds the JSON-LD WebSite schema — used for the site-search
 * knowledge panel and general search-console signals.
 *
 * @param baseUrl - Canonical marketing origin (no trailing slash).
 */
export function buildWebSiteJsonLd(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: baseUrl,
    description: site.fallbackDescription,
  };
}
