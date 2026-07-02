/**
 * @file routes.ts
 * @module app/routes
 *
 * @description
 * Cross-cutting route paths referenced outside any single feature module —
 * chiefly the auth provider's redirect targets. Feature modules define their
 * own resource paths inside their manifests; only genuinely shared destinations
 * belong here.
 */

/** Shared, cross-module route destinations. */
export const appRoutes = {
  /** Public landing page. */
  home: "/",
  /** Public login screen. */
  login: "/login",
  /** Default post-login destination. */
  dashboard: "/dashboard",
} as const;

/** Union of the shared route path strings. */
export type AppRoutePath = (typeof appRoutes)[keyof typeof appRoutes];
