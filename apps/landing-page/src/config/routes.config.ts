/**
 * @file routes.config.ts
 * @module config/routes.config
 *
 * @description
 * Canonical URL surface for the marketing app. Complements Next 16's
 * `typedRoutes` (which type-checks `<Link href>` at compile time) by
 * providing the actual constant strings + build-time metadata
 * (sitemap entries, robots disallow list, legacy redirects).
 *
 * ## Where each export is consumed
 *
 *  - `MARKETING_ROUTES`      — anywhere marketing pages link internally.
 *  - `STATIC_SITEMAP_ROUTES` — `app/sitemap.ts`.
 *  - `NON_INDEXED_PATHS`     — `app/robots.ts`.
 *  - `LEGACY_REDIRECTS`      — `next.config.ts` → `redirects()`.
 *
 * ## Split with `lib/routes.ts`
 *
 * External + cross-app URLs (SPA links) are handled by `lib/routes.ts`
 * because those need runtime env resolution ({@link envConfig.appUrl} reads
 * `process.env.NEXT_PUBLIC_APP_URL`). This file stays fully static
 * so it's safe to import from `next.config.ts` at build time.
 */

import type { MetadataRoute } from "next";

/** Every static marketing route this app publishes. */
export const MARKETING_ROUTES = {
  home: "/",
  pricing: "/pricing",
  products: "/products",
  sports: "/sports",
  enterprise: "/enterprise",
  legal: "/legal",
  blog: "/blog",
  docs: "/docs",
  changelog: "/changelog",
  customers: "/customers",
  newsletter: "/newsletter",
  createWorkspace: "/create-workspace",
  findWorkspaces: "/find-workspaces",
  contactSales: "/contact-sales",
  tutorials: "/resources/tutorials",
} as const;

/** Union of every marketing route key. */
export type MarketingRouteKey = keyof typeof MARKETING_ROUTES;

/** Union of every canonical marketing path string. */
export type MarketingRoutePath = (typeof MARKETING_ROUTES)[MarketingRouteKey];

/** How often each static route changes + its sitemap priority. */
export interface StaticSitemapEntry {
  /** Canonical path — must be a value of {@link MARKETING_ROUTES}. */
  path: MarketingRoutePath;
  /** Crawler hint for update cadence. */
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  /** 0.0 – 1.0 priority relative to other pages on the site. */
  priority: number;
}

/**
 * The list of static routes advertised in `sitemap.xml`. Dynamic
 * segments (`/products/[slug]`, `/sports/[slug]`, `/legal/[slug]`,
 * `/enterprise/[slug]`) are enumerated at build time by the sitemap
 * route itself reading the JSON fixtures.
 */
export const STATIC_SITEMAP_ROUTES: readonly StaticSitemapEntry[] = [
  { path: MARKETING_ROUTES.home, changeFrequency: "weekly", priority: 1.0 },
  { path: MARKETING_ROUTES.pricing, changeFrequency: "weekly", priority: 0.9 },
  { path: MARKETING_ROUTES.products, changeFrequency: "weekly", priority: 0.85 },
  { path: MARKETING_ROUTES.sports, changeFrequency: "weekly", priority: 0.85 },
  { path: MARKETING_ROUTES.enterprise, changeFrequency: "weekly", priority: 0.85 },
  { path: MARKETING_ROUTES.legal, changeFrequency: "monthly", priority: 0.4 },
  { path: MARKETING_ROUTES.blog, changeFrequency: "weekly", priority: 0.6 },
  { path: MARKETING_ROUTES.docs, changeFrequency: "weekly", priority: 0.7 },
  { path: MARKETING_ROUTES.changelog, changeFrequency: "weekly", priority: 0.5 },
  { path: MARKETING_ROUTES.customers, changeFrequency: "weekly", priority: 0.6 },
  { path: MARKETING_ROUTES.newsletter, changeFrequency: "monthly", priority: 0.4 },
  { path: MARKETING_ROUTES.createWorkspace, changeFrequency: "monthly", priority: 0.6 },
  { path: MARKETING_ROUTES.findWorkspaces, changeFrequency: "monthly", priority: 0.4 },
] as const;

/**
 * Paths crawlers must not index. Each entry is expanded per-locale
 * by `app/robots.ts` (bare for the default locale, `/{code}/…` for
 * others).
 */
export const NON_INDEXED_PATHS = [
  MARKETING_ROUTES.createWorkspace,
  MARKETING_ROUTES.findWorkspaces,
] as const;

/** A single Next.js redirect entry (mirrors `NextConfig["redirects"]`). */
export interface LegacyRedirect {
  /** Source path — supports Next.js route matcher syntax. */
  source: string;
  /** Absolute or relative destination path. */
  destination: string;
  /** `true` for a 308 (permanent) redirect, `false` for a 307. */
  permanent: boolean;
}

/**
 * Legacy path shortcuts kept as permanent 308 redirects. Consumed by
 * `next.config.ts`'s `redirects()`. Add new entries here rather than
 * inline in the Next config so every legacy URL is discoverable in
 * one place.
 */
export const LEGACY_REDIRECTS: readonly LegacyRedirect[] = [
  { source: "/help", destination: "/docs", permanent: true },
  { source: "/terms", destination: "/legal/terms", permanent: true },
  { source: "/privacy", destination: "/legal/privacy", permanent: true },
];

/** Aggregate handle for barrel consumers. */
export const routes = {
  marketing: MARKETING_ROUTES,
  staticSitemap: STATIC_SITEMAP_ROUTES,
  nonIndexed: NON_INDEXED_PATHS,
  legacyRedirects: LEGACY_REDIRECTS,
} as const;
