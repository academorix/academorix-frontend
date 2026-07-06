/**
 * @file sitemap.ts
 * @module app/sitemap
 *
 * @description
 * Emits `sitemap.xml` at the site root at build time. Every URL is
 * duplicated across every supported locale, and each entry declares
 * its localised alternates via `alternates.languages` — search
 * engines pick the right variant for the visitor's language + region.
 *
 * ## URL shape
 *
 *   - Default locale (`en`): bare paths (`/pricing`, `/products/athletes`)
 *     because `routing.localePrefix` is `"as-needed"`.
 *   - Other locales: `/ar/pricing`, `/ar/products/athletes`, …
 *
 * ## Static vs. dynamic
 *
 *  - Static entries come from {@link STATIC_SITEMAP_ROUTES} in
 *    `config/routes.config.ts` — the single source of truth for
 *    "every fixed marketing page".
 *  - `/products/[slug]`, `/sports/[slug]`, `/legal/[slug]`, and
 *    `/enterprise/[slug]` are enumerated at build time by reading
 *    their slugs from the shared English catalogue via
 *    `readCollectionSlugs()`. Slugs stay consistent across locales.
 */

import type { MetadataRoute } from "next";

import { envConfig } from "@/config/env.config";
import { STATIC_SITEMAP_ROUTES } from "@/config/routes.config";
import { LOCALES, routing } from "@/i18n/routing";
import { getEnterpriseSlugs, getLegalSlugs, getProductSlugs, getSportSlugs } from "@/lib/api";

/**
 * Builds the locale-scoped absolute URL for a given `path`. English
 * (the default locale) stays bare; every other locale gets its prefix.
 */
function urlFor(base: string, locale: string, path: string): string {
  if (locale === routing.defaultLocale) {
    return `${base}${path === "/" ? "" : path}` || `${base}/`;
  }

  return path === "/" ? `${base}/${locale}` : `${base}/${locale}${path}`;
}

/**
 * Builds the `alternates.languages` map for a given path — one entry
 * per supported locale so search engines can serve the right variant.
 */
function alternatesFor(base: string, path: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, urlFor(base, locale, path)]));
}

/**
 * Assembles a full sitemap entry for the given path — one row per
 * locale, each with `hreflang` alternates pointing at the other
 * locales.
 */
function entriesFor(
  base: string,
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
  priority: number,
  now: Date,
): MetadataRoute.Sitemap {
  const alternates = alternatesFor(base, path);

  return LOCALES.map((locale) => ({
    url: urlFor(base, locale, path),
    lastModified: now,
    changeFrequency,
    priority,
    alternates: { languages: alternates },
  }));
}

/**
 * Next.js reads this default export at build time and generates a
 * valid `sitemap.xml` at the site root.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = envConfig.marketingUrl;
  const now = new Date();

  // Static entries first — one row per (locale × static path) with
  // hreflang alternates baked into each row. The source list lives
  // in `config/routes.config.ts` so `sitemap`, `robots`, and any
  // future crawler-hint code all read the same array.
  const staticEntries = STATIC_SITEMAP_ROUTES.flatMap(({ path, changeFrequency, priority }) =>
    entriesFor(base, path, changeFrequency, priority, now),
  );

  // Enumerate dynamic slugs (locale-agnostic keys — see `read.ts`).
  const [productSlugs, sportSlugs, legalSlugs, enterpriseSlugs] = await Promise.all([
    getProductSlugs(),
    getSportSlugs(),
    getLegalSlugs(),
    getEnterpriseSlugs(),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...productSlugs.flatMap((slug) => entriesFor(base, `/products/${slug}`, "monthly", 0.8, now)),
    ...sportSlugs.flatMap((slug) => entriesFor(base, `/sports/${slug}`, "monthly", 0.8, now)),
    ...legalSlugs.flatMap((slug) => entriesFor(base, `/legal/${slug}`, "yearly", 0.3, now)),
    ...enterpriseSlugs.flatMap((slug) =>
      entriesFor(base, `/enterprise/${slug}`, "monthly", 0.8, now),
    ),
  ];

  return [...staticEntries, ...dynamicEntries];
}
