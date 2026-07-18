/**
 * @file router.tsx
 * @module router
 *
 * @description
 * Four-tier route tree assembled from the module registry and authored
 * through `defineRoute(...)` from `@stackra/routing` (Phase H).
 *
 * ## Tiers
 *
 *   1. **Embed** — routes declared with `tier: "embed"` render
 *      **outside** the `<AppRoot>` wrapper (no providers, no shell).
 *      Used for anonymous public dashboards embedded in third-party
 *      contexts. Every embed route mounts its own theme boot inside
 *      the page so brand tokens still resolve.
 *   2. **Chromeless** — routes declared with `tier: "chromeless"`
 *      also render **outside** the `<AppRoot>` wrapper. Used for
 *      authenticated full-viewport experiences (presenter mode,
 *      focus mode) that need the shell hidden. Structurally
 *      identical to embed at the router level; the page itself is
 *      responsible for booting whatever providers it needs. Kept as
 *      a distinct tier so future auth wiring can gate chromeless
 *      routes while leaving embed routes anonymous.
 *   3. **Public** — routes declared with `tier: "public"` render
 *      inside `<AppRoot>` (providers + theme + Refine) but skip the
 *      shell chrome via the `isPublicPath` check inside `<AppFrame>`.
 *      Login and marketing hand-offs live here.
 *   4. **Protected** — everything else renders inside `<AppRoot>` and
 *      inside `<AppShell>` (sidebar + navbar + aside).
 *
 * The `/` index redirects to `/dashboard`; unknown paths hit 404.
 *
 * ## `defineRoute` + `<StackraRoutingProvider />`
 *
 * Routes are authored via `defineRoute(...)` from `@stackra/routing` —
 * a pure typed identity function that produces `IRouteRecord` entries
 * the framework's adapter translates into RRv7's `RouteObject` shape.
 * The legacy `handle.seo` field has been folded into the top-level
 * `seo` field on each route. Migration is TODO for feature-level SEO
 * — the module registry hasn't grown a `handle` field on its route
 * entries yet, so per-page SEO comes from the page module's
 * `definePage({seo})` when that lands later.
 *
 * The exported `routes` array is passed to `defineRouterConfig(...)` in
 * `../react-router.config.ts` and consumed by `<StackraRoutingProvider />`
 * at runtime + the `router()` Vite plugin at build time (prerender).
 */

import { defineRoute } from "@stackra/routing";
import { Navigate } from "@stackra/routing/react";
import type { IRouteRecord } from "@stackra/contracts";
import type { ReactElement } from "react";

import { AppRoot } from "@/components/app-root";
import { PreviewErrorBoundary } from "@/components/preview-error-boundary";
import type { AppRoute } from "@/lib/module";
import { routesForTier } from "@/modules/registry";
import { NotFoundRoute } from "@/routes/not-found";

/**
 * Wrap the pre-rendered `element` (typically `createElement(lazy(() =>
 * import('./page')))`) in a stable Component reference. The framework's
 * `IRouteRecord` shape uses `Component` (a component reference), not
 * `element` (a rendered element) — this bridges the module registry's
 * historical `element` shape without churning every feature module.
 *
 * Each call site captures its own `route.element` in the closure so the
 * returned components stay stable across router re-renders.
 */
function elementToComponent(element: ReactElement): () => ReactElement {
  // The returned function is a legit React component: it takes no props
  // and returns a `ReactElement`. Wrapping in a stable function per
  // route entry means the router's memoization sees a stable reference
  // across renders.
  return function LazyRouteComponent(): ReactElement {
    return element;
  };
}

/**
 * Project an `AppRoute` (`element` + `path` + `index`) into an
 * `IRouteRecord` — the framework's route shape. The path stays verbatim
 * for top-level entries, and callers strip the leading slash when
 * mounting a route as a child of `/`.
 */
function toRouteRecord(route: AppRoute, extras: Partial<IRouteRecord> = {}): IRouteRecord {
  return {
    Component: elementToComponent(route.element),
    index: route.index,
    path: route.path,
    ...extras,
  };
}

// Top-level tiers — routes that mount OUTSIDE `<AppRoot>`. Both share
// the preview error boundary so a crash in an embed/chromeless page
// still gets a friendly full-page fallback rather than an inline React
// tear.
const topLevelRoutes: IRouteRecord[] = [
  ...routesForTier("embed"),
  ...routesForTier("chromeless"),
].map((route) => toRouteRecord(route, { ErrorComponent: PreviewErrorBoundary }));

// Routes nested under `<AppRoot>` — public (bare inside providers) and
// protected (behind the `<Authenticated>` gate inside `<AppShell>`).
// Path handling: `routesForTier` returns paths as `/foo/bar`; RRv7's
// child paths must NOT start with `/`, so we strip the leading slash
// here and only here. Index / pathless entries (`{ index: true }` or
// a bare fallback) have no `path` — leave those undefined so the
// adapter emits the correct RRv7 shape.
const childRoutes: IRouteRecord[] = [...routesForTier("public"), ...routesForTier("protected")].map(
  (route) =>
    toRouteRecord({
      ...route,
      path: route.path ? route.path.replace(/^\//, "") : undefined,
    }),
);

/**
 * Home redirect — points `/` at `/dashboard` unconditionally.
 *
 * Why the redirect: the root is a protected route (guarded by
 * `<Authenticated>` inside `<AppFrame>`), so an unauthenticated visitor
 * lands here → the guard bounces to `/sign-in?next=/dashboard`.
 * Authenticated visitors land on the dashboard, which is the canonical
 * home surface.
 */
function HomeRedirect(): ReactElement {
  return <Navigate replace to="/dashboard" />;
}

/**
 * The full route tree authored with `defineRoute(...)` from
 * `@stackra/routing`. Every entry is an `IRouteRecord`; the framework
 * adapter translates them to RRv7's `RouteObject` shape at runtime.
 */
export const routes: readonly IRouteRecord[] = [
  // Embed + chromeless routes sit at the top level, outside `<AppRoot>`.
  // This keeps the public embed viewer and the authenticated full-
  // viewport experiences free of the shell (sidebar, navbar, aside)
  // and any provider not required for their rendering.
  ...topLevelRoutes,
  defineRoute({
    path: "/",
    Component: AppRoot,
    ErrorComponent: PreviewErrorBoundary,
    children: [
      defineRoute({
        index: true,
        Component: HomeRedirect,
        // Redirects don't paint a page, but the descriptor still
        // participates in the merge chain during the brief render
        // frame RRv7 paints while navigating away. `robots.index:
        // false` keeps crawlers off the redirect stub.
        seo: {
          title: "Home",
          robots: { index: false, follow: true },
        },
      }),
      ...childRoutes,
      defineRoute({
        path: "*",
        Component: NotFoundRoute,
        seo: {
          title: "Page not found",
          robots: { index: false, follow: false },
        },
      }),
    ],
  }),
];
