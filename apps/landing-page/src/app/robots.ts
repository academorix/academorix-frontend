/**
 * @file robots.ts
 * @module app/robots
 *
 * @description
 * Emits `robots.txt` at the site root. Allows every crawler by
 * default, disallows the onboarding routes (they're intent forms,
 * not indexable) across every supported locale, and points at the
 * sitemap.
 *
 * The onboarding paths appear once as bare `/create-workspace` +
 * `/find-workspaces` (the default-locale form) and once for every
 * non-default locale as `/{locale}/create-workspace` etc. — that
 * way an over-eager crawler that indexes both variants still respects
 * the disallow.
 *
 * ## Source of truth
 *
 * The list of non-indexed paths lives in
 * `config/routes.config.ts` as {@link NON_INDEXED_PATHS} so
 * `sitemap.ts`, `robots.ts`, and any future crawler-hint code all
 * read from the same array.
 */

import type { MetadataRoute } from "next";

import { NON_INDEXED_PATHS } from "@/config/routes.config";
import { LOCALES, routing } from "@/i18n/routing";
import { getMarketingUrl } from "@/lib/env";

/** Builds the localised disallow list — bare for `en`, `/{locale}/…` otherwise. */
function buildDisallow(): string[] {
  const result: string[] = ["/api/"];

  for (const path of NON_INDEXED_PATHS) {
    for (const locale of LOCALES) {
      result.push(locale === routing.defaultLocale ? path : `/${locale}${path}`);
    }
  }

  return result;
}

/**
 * Next.js reads this default export at build time and generates the
 * `robots.txt` file at the site root.
 */
export default function robots(): MetadataRoute.Robots {
  const base = getMarketingUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: buildDisallow(),
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
