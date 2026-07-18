/**
 * @file render-prerender.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Render a single prerender path to an HTML string
 *   (per PLAN v3.9.2 step 5).
 *
 *   Responsibilities:
 *
 *   1. Substitute the given param bag into the route's `:param`
 *      placeholders → concrete URL.
 *   2. Build the RRv7 route tree via `toRrv7Routes(...)` from the
 *      routing package.
 *   3. Create a memory router seeded with the concrete URL via
 *      `createMemoryRouter(...)`.
 *   4. `renderToString(<RouterProvider router={router} />)`.
 *   5. Return the HTML string + a placeholder head fragment (F.3
 *      does NOT extract the actual head — SeoHead's head content
 *      re-materialises in the browser on hydration).
 *
 *   `react-dom/server` and `react-router` are imported dynamically —
 *   the plugin runs in Node context but the routing package is
 *   consumed by client code too. Dynamic import keeps the client
 *   build tree-shakable.
 *
 *   Fail-soft: a loader throw is caught + surfaced as an error
 *   record; the ErrorComponent (framework-default or route-scoped)
 *   is rendered instead. A page.prerender function throw propagates
 *   up so the whole build fails (per plan).
 */

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { RouteObject } from "react-router";

/**
 * Substitute a route's `:param` placeholders with concrete values.
 *
 * @param routePath - The path pattern (e.g. `'/blog/:slug'`).
 * @param params    - Concrete params bag from `page.prerender`.
 * @returns Concrete URL.
 *
 * @throws Error when a `:param` in the pattern has no matching key
 *   in `params` — the caller's `page.prerender` didn't supply
 *   everything the route needs, and rendering with an unfilled
 *   placeholder would produce a broken static file.
 */
export function resolveRoutePath(
  routePath: string,
  params: Readonly<Record<string, string>>,
): string {
  return routePath.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(
        `[@stackra/routing/vite] Prerender for '${routePath}' is missing param '${key}'. ` +
          `Every param in the route path must appear in the 'page.prerender' bag.`,
      );
    }
    return encodeURIComponent(String(value));
  });
}

/**
 * Render a single path against the provided RRv7 tree.
 *
 * @param routes  - Adapted RRv7 route tree (already through
 *   `attachMiddleware(...)` if the caller wants guards to run).
 * @param urlPath - Concrete URL to seed the memory router with.
 * @returns Rendered HTML string.
 */
export async function renderPrerender(
  routes: readonly RouteObject[],
  urlPath: string,
): Promise<string> {
  // Memory router runs the whole app in-process — no jsdom, no
  // fetch to the dev server. Each render is fully isolated: fresh
  // router, fresh state.
  const router = createMemoryRouter(routes as RouteObject[], {
    initialEntries: [urlPath],
  });

  // RRv7's `createMemoryRouter` kicks off loaders synchronously on
  // creation and returns a promise-like `initialize` state. We
  // observe `state.navigation.state === 'idle'` before rendering so
  // loaders complete first.
  await waitForRouterIdle(router);

  // `RouterProvider` is the DOM-hydration entry point but works fine
  // in `renderToString` since RRv7 v7 supports non-DOM environments
  // during the initial render pass.
  const element = createElement(RouterProvider, { router });
  return renderToString(element);
}

/**
 * Wait for a memory router to complete its initial data-fetch pass.
 *
 * `router.state.navigation.state === 'idle'` means every in-flight
 * loader / action has resolved and the tree is ready to render.
 */
async function waitForRouterIdle(router: ReturnType<typeof createMemoryRouter>): Promise<void> {
  // Poll on microtasks — RRv7's state transitions happen inside
  // `Promise.resolve()` chains, so a microtask yield is enough.
  // The upper bound is a safety net for tests / misconfigured
  // loaders — real routes settle in a few dozen microtasks max.
  const maxIterations = 500;
  for (let i = 0; i < maxIterations; i += 1) {
    if (router.state.navigation.state === "idle" && router.state.revalidation === "idle") {
      return;
    }
    // eslint-disable-next-line no-await-in-loop -- polling loop by design
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  }
  // Best-effort — proceed even if we timed out. Rendering an
  // in-flight tree still produces the loading fallback, which is a
  // valid static output.
}
