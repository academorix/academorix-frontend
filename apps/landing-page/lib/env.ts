/**
 * @file env.ts
 * @module lib/env
 *
 * @description
 * Public marketing-app environment resolver. Every variable is browser-safe
 * (Next.js requires the `NEXT_PUBLIC_` prefix for anything the client sees).
 * Defaults keep local dev booting without env config.
 *
 * The tenant SPA lives at `app.academorix.app` (or a tenant subdomain) — the
 * marketing surface links out to it for every conversion CTA. Setting
 * `NEXT_PUBLIC_APP_URL` at build time on Vercel produces cross-origin absolute
 * URLs; the same variable overrides the local dev value during preview
 * deployments.
 */

/**
 * Resolves the target URL for the tenant app (SPA). Anonymous "Sign in" /
 * "Get started" CTAs on the marketing site point here. Trims trailing slash so
 * callers can concatenate a path unconditionally.
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return raw.replace(/\/+$/, "");
}

/**
 * Resolves the marketing site's own canonical origin. Used for OG images,
 * sitemap entries, and canonical link tags. Local dev falls back to the
 * default Next.js port (3001 so marketing and SPA can run side-by-side).
 */
export function getMarketingUrl(): string {
  const raw = process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3001";

  return raw.replace(/\/+$/, "");
}

/**
 * Backend API origin — only used by the (future) server-side pricing catalog
 * fetch. Marketing pages otherwise render off the static plan fixture.
 */
export function getBackendUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

  return raw.replace(/\/+$/, "");
}
