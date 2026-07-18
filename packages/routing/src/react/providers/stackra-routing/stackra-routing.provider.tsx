/**
 * @file stackra-routing.provider.tsx
 * @module @stackra/routing/react/providers/stackra-routing
 * @description Application-level routing provider (per PLAN v3.10.1).
 *
 *   Wires three concerns:
 *     1. Resolves the DI container — from the `app` prop or from
 *        `getGlobalApplicationContext()`.
 *     2. Reads the route tree — from the `routes` prop or from
 *        `ROUTE_REGISTRY` on the container.
 *     3. Transforms the tree via `toRrv7Routes(...)` then
 *        `attachMiddleware(routes, app, 'client')`, and constructs
 *        the RRv7 router (browser / memory / hash based on `kind`).
 *
 *   Mounts:
 *     - `<StackraRoutingContext.Provider>` — publishes the routing
 *       state to hooks.
 *     - `<OverlayProvider>` — provides the overlay stack state so
 *       `<OverlayOutlet>` renders on demand.
 *     - `<RouterProvider>` — the RRv7 entry.
 *     - `<A11yAnnouncer />` — per PLAN v3.11.6 (auto, consumers can
 *       disable via `a11yAnnouncer={false}`).
 */

import { useMemo, type ReactElement } from "react";
import type { IApplication, IRouteRecord, IRoutingModuleOptions } from "@stackra/contracts";
import { ROUTE_REGISTRY, ROUTING_CONFIG } from "@stackra/contracts";
import { getGlobalApplicationContext } from "@stackra/container";
import {
  createBrowserRouter,
  createHashRouter,
  createMemoryRouter,
  RouterProvider,
} from "react-router";

import { DEFAULT_ROUTING_CONFIG } from "@/core/constants";
import { RouteRegistryService } from "@/core/services/route-registry.service";

import { A11yAnnouncer } from "@/react/components/a11y-announcer";
import { StackraRoutingContext } from "@/react/contexts";
import type { IStackraRouter } from "@/react/contexts";
import { attachMiddleware } from "@/react/attach-middleware/attach-middleware.util";
import { toRrv7Routes } from "@/react/adapt-page-module/to-rrv7-routes.util";

import { OverlayProvider } from "../overlay/overlay.provider";
import type { IStackraRoutingProviderProps } from "./stackra-routing-provider.interface";

/**
 * `<StackraRoutingProvider>` — the routing entry point.
 *
 * Consumers place this once at the tree root, inside a
 * `<ContainerProvider>` from `@stackra/container/react`.
 *
 * @example
 * ```tsx
 * import { StackraRoutingProvider } from '@stackra/routing/react';
 *
 * createRoot(el).render(
 *   <ContainerProvider context={app}>
 *     <StackraRoutingProvider />
 *   </ContainerProvider>
 * );
 * ```
 */
export function StackraRoutingProvider(props: IStackraRoutingProviderProps = {}): ReactElement {
  const {
    app: appProp,
    routes: routesProp,
    kind = "browser",
    opts,
    a11yAnnouncer = true,
    fallback,
  } = props;
  // `fallback` is reserved — RRv7 v7 uses per-route `HydrateFallback`
  // instead of a global fallback. Kept in the interface for API
  // stability.
  void fallback;

  // 1. Resolve the container. Prop wins; otherwise global.
  const app = appProp ?? getGlobalApplicationContext();
  if (!app) {
    // Clear failure message — same shape as SSR's port. Names both
    // fixes so remediation is one grep away.
    throw new Error(
      "StackraRoutingProvider: no application container found. " +
        "Call ApplicationFactory.create(AppModule) before rendering, " +
        "or pass an explicit `app` prop.",
    );
  }

  // 2. Resolve the merged config. When the DI wire is missing (tests
  // constructing the provider from a bare app), fall back to the
  // package defaults so the provider still boots.
  const config = readConfig(app);

  // 3. Route tree — prop wins; else read the registry.
  const routes = routesProp ?? readRegistryTree(app);

  // 4. Build the RRv7 router. `useMemo` keeps the router stable
  // across re-renders — routing state lives on the router itself.
  const router = useMemo<IStackraRouter>(() => {
    const rrv7Tree = toRrv7Routes(routes);
    // Client-side routers always run middleware with `environment:
    // 'client'`. The build-time server variant is F.3's concern.
    const wired = attachMiddleware(rrv7Tree, app as IApplication, "client");
    switch (kind) {
      case "memory":
        return createMemoryRouter(wired, opts as never);
      case "hash":
        return createHashRouter(wired, opts as never);
      case "browser":
      default:
        return createBrowserRouter(wired, opts as never);
    }
  }, [app, routes, kind, opts]);

  const contextValue = useMemo(
    () => ({
      container: app as IApplication,
      config,
      router,
    }),
    [app, config, router],
  );

  return (
    <StackraRoutingContext.Provider value={contextValue}>
      <OverlayProvider>
        <RouterProvider router={router} />
        {/* A11y announcer per PLAN v3.11.6 — auto-mounted unless
            the caller opts out via `a11yAnnouncer={false}`. */}
        {a11yAnnouncer ? <A11yAnnouncer /> : null}
      </OverlayProvider>
    </StackraRoutingContext.Provider>
  );
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Read the merged routing config from the container. When the wire
 * is missing (tests, minimal apps), fall back to the package
 * defaults so the provider still boots.
 */
function readConfig(app: unknown): IRoutingModuleOptions {
  try {
    const config = (app as IApplication).get(ROUTING_CONFIG) as IRoutingModuleOptions;
    return config ?? DEFAULT_ROUTING_CONFIG;
  } catch {
    // fail-soft — no ROUTING_CONFIG wired.
    return DEFAULT_ROUTING_CONFIG;
  }
}

/**
 * Read the route tree from the container's `RouteRegistryService`.
 * Empty array when the registry is unwired — a clearer dev-time
 * signal than a crash.
 */
function readRegistryTree(app: unknown): readonly IRouteRecord[] {
  try {
    // The registry is keyed under both `ROUTE_REGISTRY` (contract
    // token) and the class itself. Reach for the token to stay
    // consistent with the rest of the framework.
    const registry = (app as IApplication).get(ROUTE_REGISTRY) as RouteRegistryService;
    return registry.listRoutes();
  } catch {
    // fail-soft — no registry wired.
    return [];
  }
}
