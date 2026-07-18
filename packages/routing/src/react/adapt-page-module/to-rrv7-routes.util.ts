/**
 * @file to-rrv7-routes.util.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Walk a `readonly IRouteRecord[]` (from `defineRoute(...)`
 *   composition) and produce the flat RRv7 `RouteObject[]` tree the
 *   framework hands to `createBrowserRouter` / `createMemoryRouter` /
 *   `createHashRouter`.
 *
 *   For every route:
 *     1. If the route has `lazy`, we surface an RRv7-compatible `lazy`
 *        that awaits the import + runs it through `adaptPageModule` /
 *        `adaptLayoutModule` based on the exports found.
 *     2. If the route has an inline `Component`, we adapt the config
 *        already on the record (no lazy roundtrip).
 *     3. In both cases, `handle[STACKRA_HANDLE]` receives the private
 *        Stackra bag so the middleware attachment step + the framework
 *        hooks find their data on the RRv7 match.
 */

import type { RouteObject } from "react-router";
import type { IRouteRecord } from "@stackra/contracts";

import { STACKRA_HANDLE } from "@/core/constants";

import { adaptLayoutModule } from "./adapt-layout-module.util";
import { adaptPageModule } from "./adapt-page-module.util";
import type { ILayoutModule, IPageModule } from "./page-module.interface";

/**
 * Transform a Stackra route tree into the RRv7 route tree.
 *
 * @param routes - Route records authored via `defineRoute(...)`.
 * @returns Flat RRv7 route tree.
 *
 * @example
 * ```typescript
 * const rrv7 = toRrv7Routes(routes);
 * const router = createBrowserRouter(rrv7);
 * ```
 */
export function toRrv7Routes(routes: readonly IRouteRecord[]): RouteObject[] {
  return routes.map((route) => toRrv7Route(route));
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Adapt a single Stackra route record.
 */
function toRrv7Route(route: IRouteRecord): RouteObject {
  // Base shape — properties RRv7 reads directly. We spread these
  // onto the final object below, then layer on the adapter-produced
  // fields.
  const base = {
    id: route.id,
    path: route.path,
    index: route.index,
    caseSensitive: route.caseSensitive,
  } as Partial<RouteObject>;

  // Recursive children — walk before we build the parent so the
  // parent's handle sees the same STACKRA_HANDLE shape as leaves.
  const children = route.children ? toRrv7Routes(route.children) : undefined;

  // Case A — lazy-loaded module. Turn RRv7's `lazy` into a shim that
  // awaits the caller's import, detects `page` vs `layout` exports,
  // and delegates to the appropriate adapter.
  if (typeof route.lazy === "function") {
    return {
      ...base,
      ...(children ? { children } : {}),
      // RRv7 supports `lazy` returning either an object of route
      // properties OR a `RouteObject` — we return an object of route
      // properties, which RRv7 merges onto the parent.
      lazy: async () => {
        const module = await (route.lazy as () => Promise<Record<string, unknown>>)();
        // Detect module shape — `page` export ⇒ page, `layout` ⇒ layout.
        if ("page" in module) {
          const adapted = adaptPageModule(module as unknown as IPageModule);
          // Fold the route-record-level `middleware` / `guards` into
          // the handle so `attachMiddleware` sees them.
          return mergeRouteRecordHandle(adapted, route);
        }
        if ("layout" in module) {
          const adapted = adaptLayoutModule(module as unknown as ILayoutModule);
          return mergeRouteRecordHandle(adapted, route);
        }
        // Fallback — module has only a `default` export. Treat as a
        // page with no `definePage(...)` config.
        const emptyPageModule: IPageModule = {
          default: (module.default ?? (() => null)) as IPageModule["default"],
          page: {},
        };
        const adapted = adaptPageModule(emptyPageModule);
        return mergeRouteRecordHandle(adapted, route);
      },
    } as RouteObject;
  }

  // Case B — inline route. The record itself carries the component +
  // config; we synthesise the handle here.
  const stackraHandle = {
    seo: route.seo,
    guards: route.guards,
    middleware: route.middleware,
    history: route.history,
    slots: {
      Pending: route.PendingComponent,
      Loading: route.LoadingComponent,
      Error: route.ErrorComponent,
      NotFound: route.NotFoundComponent,
      Empty: route.EmptyComponent,
    },
    isEmpty: route.isEmpty,
    mode: route.mode,
    overlay: route.overlay,
    head: route.head,
    access: route.access,
    // Inline routes carry `analytics` at the top level.
    analytics: route.analytics,
  };

  const handle: Record<string | symbol, unknown> = {
    breadcrumb: route.breadcrumb,
    ...(route.analytics !== undefined ? { analytics: route.analytics } : {}),
    [STACKRA_HANDLE]: stackraHandle,
  };

  return {
    ...base,
    Component: route.Component,
    HydrateFallback: route.LoadingComponent,
    ErrorBoundary: route.ErrorComponent,
    // Inline loaders — `page.load(...)` shape mirrored into RRv7's
    // `LoaderFunction`.
    loader:
      typeof route.load === "function"
        ? (args) => {
            return (
              route.load as (loaderArgs: {
                readonly params: Readonly<Record<string, string>>;
                readonly request: Request;
              }) => unknown
            )({
              params: args.params as Readonly<Record<string, string>>,
              request: args.request,
            });
          }
        : undefined,
    handle,
    ...(children ? { children } : {}),
  } as RouteObject;
}

/**
 * Merge the route-record-level `guards` / `middleware` into the
 * adapted route's handle. When a lazy-loaded module ships its own
 * `page.guards` / `page.middleware`, the record-level fields are
 * CONCATENATED after the module's — record-level fields augment,
 * they don't replace.
 */
function mergeRouteRecordHandle(adapted: RouteObject, route: IRouteRecord): Partial<RouteObject> {
  const existing = (adapted.handle as Record<string | symbol, unknown> | undefined) ?? {};
  const stackra = (existing[STACKRA_HANDLE] as Record<string, unknown> | undefined) ?? {};

  // Concatenate guards / middleware — record-level entries append.
  const guards = concatIfPresent(stackra.guards as readonly unknown[] | undefined, route.guards);
  const middleware = concatIfPresent(
    stackra.middleware as readonly unknown[] | undefined,
    route.middleware,
  );

  return {
    ...adapted,
    handle: {
      // Preserve any top-level `breadcrumb` / `analytics` the adapter
      // set; the record-level `breadcrumb` / `analytics` win when
      // present (route-record precedence per PLAN v3.1).
      ...existing,
      ...(route.breadcrumb !== undefined ? { breadcrumb: route.breadcrumb } : {}),
      ...(route.analytics !== undefined ? { analytics: route.analytics } : {}),
      [STACKRA_HANDLE]: {
        ...stackra,
        ...(guards ? { guards } : {}),
        ...(middleware ? { middleware } : {}),
        // Route-record slots override module slots for the fields set.
        slots: {
          ...(stackra.slots as Record<string, unknown> | undefined),
          ...(route.LoadingComponent ? { Loading: route.LoadingComponent } : {}),
          ...(route.PendingComponent ? { Pending: route.PendingComponent } : {}),
          ...(route.ErrorComponent ? { Error: route.ErrorComponent } : {}),
          ...(route.NotFoundComponent ? { NotFound: route.NotFoundComponent } : {}),
          ...(route.EmptyComponent ? { Empty: route.EmptyComponent } : {}),
        },
        ...(route.access !== undefined ? { access: route.access } : {}),
        ...(route.head !== undefined ? { head: route.head } : {}),
      },
    },
  };
}

/**
 * Concatenate two "may be undefined" arrays into one. Returns
 * `undefined` when both are missing so the merged handle stays lean.
 */
function concatIfPresent<T>(
  a: readonly T[] | undefined,
  b: readonly T[] | undefined,
): readonly T[] | undefined {
  if (!a && !b) return undefined;
  return [...(a ?? []), ...(b ?? [])];
}
