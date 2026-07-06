/**
 * @file seo.config.ts
 * @module config/seo.config
 *
 * @description
 * Metadata defaults for search + social. The per-locale Open Graph
 * and Twitter copy (title template, description) still comes from
 * `app/[locale]/layout.tsx` → `generateMetadata()` reading
 * `public/data/{locale}/site.json`; this file owns the LOCALE-AGNOSTIC
 * defaults (OG image path, Twitter handle, image domains,
 * verification tokens, JSON-LD helpers) that every locale layers its
 * copy on top of.
 *
 * ## Where each field is consumed
 *
 *  - `REMOTE_IMAGE_PATTERNS`  — `next.config.ts` → `images.remotePatterns`.
 *  - `SEO_KEYWORDS`           — `<meta name="keywords">` (Metadata API).
 *  - `TWITTER_HANDLE`         — Twitter Card `<meta name="twitter:site">`.
 *  - `verification`           — Google Search Console / Bing metatags.
 *  - `buildBreadcrumbJsonLd`  — deep pages (`/products/[slug]`, …).
 */

/** Default Open Graph image served at `/opengraph-image` (Next 16 route). */
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

/** Fallback OG image used when the Next route hasn't been generated. */
export const FALLBACK_OG_IMAGE_PATH = "/pwa-512x512.png";

/** Twitter handle for `twitter:site` — matches `site.socials.x`. */
export const TWITTER_HANDLE = "@academorix";

/** Keywords advertised via `<meta name="keywords">`. */
export const SEO_KEYWORDS: readonly string[] = [
  "academy management software",
  "sports academy platform",
  "multi-sport academy OS",
  "athlete management",
  "coach dashboard",
  "sports scheduling software",
  "academy payments and memberships",
  "multi-branch academy",
  "bilingual academy management",
  "safeguarding software",
] as const;

/**
 * Image remote patterns consumed by `next.config.ts`. Adding a CDN
 * origin here is enough to let `next/image` optimise images served
 * from it.
 *
 * The tuple is intentionally `readonly` — `next.config.ts` spreads it
 * into a fresh array before handing it to Next's typed config so the
 * mutation guarantees of `NextConfig["images"]["remotePatterns"]` are
 * preserved.
 */
export const REMOTE_IMAGE_PATTERNS: ReadonlyArray<{
  protocol: "https" | "http";
  hostname: string;
}> = [
  { protocol: "https", hostname: "academorix.com" },
  { protocol: "https", hostname: "**.academorix.com" },
  { protocol: "https", hostname: "academorix.app" },
  { protocol: "https", hostname: "**.academorix.app" },
  { protocol: "https", hostname: "heroui-assets.nyc3.cdn.digitaloceanspaces.com" },
  { protocol: "https", hostname: "avatars.githubusercontent.com" },
];

/**
 * Verification tokens — set per env with `NEXT_PUBLIC_*_VERIFICATION`
 * so the layout can splice them into `<meta name="google-site-
 * verification">` / `<meta name="msvalidate.01">` etc.
 */
export const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION ?? "",
  bing: process.env.NEXT_PUBLIC_BING_VERIFICATION ?? "",
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION ?? "",
} as const;

/** Consolidated SEO defaults. Imported by consumers via `@/config`. */
export const seo = {
  defaultOgImage: DEFAULT_OG_IMAGE_PATH,
  fallbackOgImage: FALLBACK_OG_IMAGE_PATH,
  twitterHandle: TWITTER_HANDLE,
  twitterCard: "summary_large_image" as const,
  keywords: SEO_KEYWORDS,
  remoteImagePatterns: REMOTE_IMAGE_PATTERNS,
  verification,
} as const;

/**
 * A single crumb inside the JSON-LD BreadcrumbList schema. Consumers
 * pass a list of these to {@link buildBreadcrumbJsonLd}.
 */
export interface Crumb {
  /** Visible name (e.g. "Products", "Athletes"). */
  name: string;
  /** Absolute URL of the crumb target. */
  url: string;
}

/**
 * Builds a JSON-LD BreadcrumbList — one entry per crumb, positioned
 * from 1. Google surfaces this as breadcrumbs in the SERP.
 *
 * @param crumbs - Ordered list of breadcrumb entries (top-most first).
 */
export function buildBreadcrumbJsonLd(crumbs: readonly Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
