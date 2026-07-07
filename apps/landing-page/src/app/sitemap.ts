/**
 * @file sitemap.ts
 * @module app/sitemap
 *
 * @description
 * Emits `sitemap.xml` at the site root at build time. Every URL is
 * duplicated across every supported locale, and each entry declares
 * its localised alternates via `alternates.languages` so search
 * engines pick the right variant for the visitor's language + region.
 *
 * Static entries come from {@link STATIC_SITEMAP_ROUTES}. Dynamic
 * routes (`/products/[slug]`, `/sports/[slug]`, `/enterprise/[slug]`,
 * `/solutions/[slug]`, `/for/[slug]`, `/legal/[slug]`,
 * `/customers/[slug]`, `/blog/[slug]`) are enumerated at build time
 * by reading slugs from the shared English catalogue. Slugs stay
 * consistent across locales.
 */

import type { MetadataRoute } from "next";

import { envConfig } from "@/config/env.config";
import { STATIC_SITEMAP_ROUTES } from "@/config/routes.config";
import { LOCALES, routing } from "@/i18n/routing";
import {
  getBlogSlugs,
  getCustomerStorySlugs,
  getEnterpriseSlugs,
  getLegalSlugs,
  getPersonaSlugs,
  getProductSlugs,
  getSolutionSlugs,
  getSportSlugs,
} from "@/lib/api";

/** Builds the locale-scoped absolute URL for a given `path`. */
function urlFor(base: string, locale: string, path: string): string {
  if (locale === routing.defaultLocale) {
    return `${base}${path === "/" ? "" : path}` || `${base}/`;
  }

  return path === "/" ? `${base}/${locale}` : `${base}/${locale}${path}`;
}

/** Builds the `alternates.languages` map for a given path. */
function alternatesFor(base: string, path: string): Record<string, string> {
  return Object.fromEntries(LOCALES.map((locale) => [locale, urlFor(base, locale, path)]));
}

/** Assembles a full sitemap entry — one row per locale with hreflang alternates. */
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

/** Next.js reads this default export at build time. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = envConfig.marketingUrl;
  const now = new Date();

  const staticEntries = STATIC_SITEMAP_ROUTES.flatMap(({ path, changeFrequency, priority }) =>
    entriesFor(base, path, changeFrequency, priority, now),
  );

  const [
    productSlugs,
    sportSlugs,
    enterpriseSlugs,
    solutionSlugs,
    personaSlugs,
    legalSlugs,
    customerSlugs,
    blogSlugs,
  ] = await Promise.all([
    getProductSlugs(),
    getSportSlugs(),
    getEnterpriseSlugs(),
    getSolutionSlugs(),
    getPersonaSlugs(),
    getLegalSlugs(),
    getCustomerStorySlugs(),
    getBlogSlugs(),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...productSlugs.flatMap((slug) => entriesFor(base, `/products/${slug}`, "monthly", 0.8, now)),
    ...sportSlugs.flatMap((slug) => entriesFor(base, `/sports/${slug}`, "monthly", 0.8, now)),
    ...enterpriseSlugs.flatMap((slug) =>
      entriesFor(base, `/enterprise/${slug}`, "monthly", 0.8, now),
    ),
    ...solutionSlugs.flatMap((slug) => entriesFor(base, `/solutions/${slug}`, "monthly", 0.7, now)),
    ...personaSlugs.flatMap((slug) => entriesFor(base, `/for/${slug}`, "monthly", 0.6, now)),
    ...legalSlugs.flatMap((slug) => entriesFor(base, `/legal/${slug}`, "yearly", 0.3, now)),
    ...customerSlugs.flatMap((slug) => entriesFor(base, `/customers/${slug}`, "monthly", 0.7, now)),
    ...blogSlugs.flatMap((slug) => entriesFor(base, `/blog/${slug}`, "monthly", 0.5, now)),
  ];

  return [...staticEntries, ...dynamicEntries];
}
