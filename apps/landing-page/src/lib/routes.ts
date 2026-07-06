/**
 * @file routes.ts
 * @module lib/routes
 *
 * @description
 * Cross-app URL helpers. The marketing surface (`apps/landing-page`) is a
 * separate origin from the tenant SPA (`apps/web`), so every conversion CTA
 * points to an absolute URL through {@link appUrl}.
 *
 * Local (`apps/landing-page`) routes stay relative — they resolve inside Next's
 * router with zero framework knowledge required.
 */

import { envConfig } from "@/config/env.config";

/**
 * Builds an absolute URL into the tenant SPA. Falls back to the local dev port
 * when `NEXT_PUBLIC_APP_URL` is unset.
 *
 * @param path - Path segment starting with `/`, e.g. `/login`.
 */
export function appUrl(path: string): string {
  const base = envConfig.appUrl;
  const normalisedPath = path.startsWith("/") ? path : `/${path}`;

  return `${base}${normalisedPath}`;
}

/**
 * The canonical marketing → SPA routes. Keep this in sync with
 * `apps/web/src/lib/module/routes.ts`. Every entry is an **absolute** URL so
 * `<Link href={...}>` from `next/link` naturally opens the SPA cross-origin.
 */
export const spaRoutes = {
  /** Sign in flow (tenant surface). */
  login: () => appUrl("/login"),
  /** Register flow (tenant surface). */
  register: () => appUrl("/register"),
  /** Signed-in dashboard landing. */
  dashboard: () => appUrl("/dashboard"),
  /** Signed-in billing settings — target for `/pricing` → "Upgrade". */
  billingSettings: () => appUrl("/settings/billing"),
} as const;

/**
 * Marketing routes served by this app. Purely relative — Next.js router
 * handles them client-side.
 */
export const marketingRoutes = {
  home: "/",
  pricing: "/pricing",
  createWorkspace: "/create-workspace",
  findWorkspaces: "/find-workspaces",
} as const;
