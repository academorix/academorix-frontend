/**
 * @file middleware.ts
 * @module middleware
 *
 * @description
 * Edge middleware that runs before every request to the marketing site.
 * Delegates entirely to `next-intl`'s middleware factory, which handles:
 *
 *   - Locale detection (URL segment > `NEXT_LOCALE` cookie > `Accept-Language`
 *     header > `routing.defaultLocale`)
 *   - Redirecting bare URLs to the locale-prefixed variant when the
 *     visitor's preferred locale differs from the default (English)
 *   - Setting the `NEXT_LOCALE` cookie whenever the visitor lands on a
 *     locale-prefixed URL (persists their choice across visits)
 *   - Populating `x-next-intl-locale` headers so RSC + `getRequestConfig`
 *     can read the resolved locale server-side
 *
 * ## The matcher
 *
 * Excludes the standard Next static assets + API routes + files with
 * extensions (so `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, dynamic
 * OG images, and static media pass through untouched).
 */

import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/** The middleware entry — one factory call, one `next-intl` instance. */
export default createMiddleware(routing);

/**
 * Route-scoping config. Runs on every path except:
 *   - Next's internal endpoints (`_next/*`, `_vercel/*`)
 *   - API routes (`api/*`)
 *   - Any file with an extension (favicon, images, sitemap, robots, OG)
 */
export const config = {
  matcher: [
    // Match all pathnames except for:
    //   - API routes
    //   - Next.js internals + Vercel internals
    //   - Anything that looks like a file (contains a dot)
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
