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
 *
 * ## External SaaS integrations
 *
 * Marketing links out to three third-party surfaces we don't own the UI for:
 *
 *  - **Featurebase** — the changelog / product-updates board hosted at
 *    `academorix.featurebase.app`. Replaces our internal `/changelog` route.
 *  - **Mintlify** — the docs portal hosted at `docs.academorix.com` once
 *    provisioned; falls back to the marketing origin's `/docs` placeholder
 *    for local dev.
 *  - **YouTube** — the tutorials channel. Replaces our internal
 *    `/resources/tutorials` route.
 *
 * Each has its own `NEXT_PUBLIC_*_URL` env var so preview / staging /
 * production can point at different endpoints (e.g. staging Mintlify).
 */

/**
 * Trims one or more trailing slashes off a URL so callers can concatenate a
 * path unconditionally: `${getAppUrl()}/login` always yields exactly one `/`.
 */
function trimTrailingSlash(raw: string): string {
  return raw.replace(/\/+$/, "");
}

/**
 * Resolves the target URL for the tenant app (SPA). Anonymous "Sign in" /
 * "Get started" CTAs on the marketing site point here.
 */
export function getAppUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

/**
 * Resolves the marketing site's own canonical origin. Used for OG images,
 * sitemap entries, and canonical link tags. Local dev falls back to the
 * default Next.js port (3001 so marketing and SPA can run side-by-side).
 */
export function getMarketingUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3001");
}

/**
 * Backend API origin — only used by the (future) server-side pricing catalog
 * fetch. Marketing pages otherwise render off the static plan fixture.
 */
export function getBackendUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000");
}

/**
 * Featurebase changelog board — the `/changelog` route bounces here. Override
 * per environment with `NEXT_PUBLIC_FEATUREBASE_URL`.
 */
export function getChangelogUrl(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_FEATUREBASE_URL ?? "https://academorix.featurebase.app",
  );
}

/**
 * Mintlify docs portal — the `/docs` route bounces here. Override per
 * environment with `NEXT_PUBLIC_DOCS_URL`. Falls back to `docs.academorix.com`.
 */
export function getDocsUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.academorix.com");
}

/**
 * YouTube tutorials channel — the `/resources/tutorials` route bounces here.
 * Override per environment with `NEXT_PUBLIC_TUTORIALS_URL`.
 */
export function getTutorialsUrl(): string {
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_TUTORIALS_URL ?? "https://www.youtube.com/@academorix",
  );
}

/**
 * Public status page — surfaced by the footer "Status" link.
 */
export function getStatusUrl(): string {
  return trimTrailingSlash(process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.academorix.com");
}
