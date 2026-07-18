/**
 * @file adapt-page-module.util.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Turn a Stackra `IPageModule` into an RRv7 `RouteObject`.
 *
 *   Consumers never call this directly — the framework's provider
 *   walks the route tree and passes every lazy-loaded module through
 *   `adaptPageModule`. PLAN v3.1 is the canonical reference.
 *
 *   Fields extracted:
 *     - `page.load`               → `RouteObject.loader`
 *     - `page.LoadingComponent`   → `RouteObject.HydrateFallback`
 *     - `page.ErrorComponent`     → `RouteObject.ErrorBoundary`
 *     - `page.seo`                → `RouteObject.meta` (basic tags)
 *     - Everything else lives on `handle[STACKRA_HANDLE]` and is
 *       consumed by the framework's hooks + components.
 */

import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import type { IPageConfig } from "@stackra/contracts";

import { buildRouteObject } from "./build-route-object.util";
import type { IPageModule } from "./page-module.interface";

/**
 * Adapt a `IPageModule` to an RRv7 `RouteObject`.
 *
 * @param module - Page module (`{default, page}`).
 * @returns RRv7 route object with `handle[STACKRA_HANDLE]` populated.
 *
 * @example
 * ```typescript
 * const rrvRoute = adaptPageModule(await import('./pages/blog-post'));
 * ```
 */
export function adaptPageModule(module: IPageModule): RouteObject {
  const page: IPageConfig = module.page ?? {};
  const Component: ComponentType | undefined = module.default;

  return buildRouteObject({
    Component,
    page,
    kind: "page",
  });
}
