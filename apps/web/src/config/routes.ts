/**
 * @file routes.ts
 * @module config/routes
 *
 * @description
 * Central registry of application route paths. Every redirect, `<Route>`,
 * sidebar link, and resource definition references these constants instead of
 * hard-coding path strings, so a route can be renamed in exactly one place.
 */

/** All top-level route paths, grouped by public vs authenticated. */
export const routes = {
  /** Public marketing landing page. */
  home: "/",
  /** Public login screen. */
  login: "/login",

  /** Authenticated area. */
  dashboard: "/dashboard",
  students: "/students",
  coaches: "/coaches",
  courses: "/courses",
  teams: "/teams",
  branches: "/branches",
} as const;

/** Union of every known route path string. */
export type AppRoute = (typeof routes)[keyof typeof routes];
