/**
 * @file dashboard.module.ts
 * @module modules/dashboard/dashboard.module
 *
 * @description
 * Dashboard module manifest. Registers:
 *
 *   * The `dashboard` Refine resource — powers the sidebar entry
 *     and the ⌘K palette Navigate command.
 *   * Two protected routes — `/dashboard` (default resolution) and
 *     `/dashboard/:slug` (specific dashboard by slug).
 *   * One `embed` route — `/embed/dashboard/:token` — rendered
 *     **outside** the shell for anonymous public viewers.
 *
 * The pages are lazy-loaded so the code splits per route.
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

/** Lazy the main dashboard page — one chunk for both the index + slug routes. */
const DashboardPage = lazy(() => import("./pages/dashboard"));

/** Lazy the public embed viewer — kept separate so its bundle stays lean. */
const DashboardEmbedPage = lazy(() => import("./pages/embed"));

/** Lazy the broadcast viewer — the Phase-1 unified share surface. */
const DashboardBroadcastPage = lazy(() => import("./pages/broadcast"));

/**
 * Lazy the presenter mode viewer — mounted under the `chromeless`
 * tier so it renders full-viewport, outside the app shell. See
 * `pages/present.tsx` for the full behaviour contract.
 */
const DashboardPresenterPage = lazy(() => import("./pages/present"));

const dashboardModule: AppModule = {
  name: "dashboard",
  resources: [
    {
      name: "dashboard",
      list: "/dashboard",
      meta: {
        label: "Dashboard",
        icon: "chart-column",
        groupKey: "overview",
        order: 0,
        featureKey: "dashboard",
        shortcuts: { navigate: "G D" },
        crud: "list-only",
      },
    },
  ],
  routes: [
    // The index (no slug) reads the user's default dashboard.
    { element: createElement(DashboardPage), path: "/dashboard", tier: "protected" },
    // Presenter mode — static path declared before the slug variant
    // so React Router's specificity scoring picks it up first. Runs
    // under the `chromeless` tier so the shell never mounts around
    // the full-viewport slideshow.
    {
      element: createElement(DashboardPresenterPage),
      path: "/dashboard/present",
      tier: "chromeless",
    },
    // The slug variant resolves a specific dashboard.
    { element: createElement(DashboardPage), path: "/dashboard/:slug", tier: "protected" },
    // Public embed (legacy) — rendered outside the shell entirely.
    // Retained so links minted before the broadcast Phase-1 landing
    // still resolve. The page delegates to `DashboardBroadcastPage`
    // internally so both routes share one implementation.
    {
      element: createElement(DashboardEmbedPage),
      path: "/embed/dashboard/:token",
      tier: "embed",
    },
    // Broadcast viewer — the unified share surface. Handles unlock
    // gate, embed rendering, and present-mode rotation.
    {
      element: createElement(DashboardBroadcastPage),
      path: "/broadcast/:token",
      tier: "embed",
    },
  ],
};

export default dashboardModule;
