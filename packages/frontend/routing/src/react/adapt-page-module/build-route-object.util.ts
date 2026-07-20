/**
 * @file build-route-object.util.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Shared internal builder used by `adaptPageModule` and
 *   `adaptLayoutModule`.
 *
 *   The two public adapters share most of the RRv7 route-object
 *   shape — they only differ on `page`-only fields (`load`,
 *   `analytics`, `mode`, `overlay`). This helper takes an explicit
 *   `kind` discriminator so the caller pins the shape.
 *
 *   Not re-exported from the module's barrel — internal API only.
 */

import type { ComponentType } from "react";
import type { LoaderFunctionArgs, MetaFunction, RouteObject } from "react-router";
import type { IPageConfig } from "@stackra/contracts";

import { STACKRA_HANDLE } from "@/core/constants";
import { resolveValue } from "@/core/utils/resolve-value.util";
import type { ISeoDescriptor } from "@/seo/interfaces/seo-descriptor.interface";

import { extractBasicMetaTags } from "./extract-basic-meta-tags.util";

/**
 * Input to `buildRouteObject(...)`. INTERNAL.
 */
export interface IBuildRouteObjectInput {
  readonly Component: ComponentType | undefined;
  readonly page: IPageConfig;
  readonly kind: "page" | "layout";
}

/**
 * Build an RRv7 `RouteObject` from a Stackra page/layout config.
 *
 * INTERNAL — consumed by `adaptPageModule` and `adaptLayoutModule`.
 *
 * @param input - Component + resolved config + kind discriminator.
 * @returns RRv7 route object with `handle[STACKRA_HANDLE]` populated.
 */
export function buildRouteObject(input: IBuildRouteObjectInput): RouteObject {
  const { Component, page, kind } = input;

  // `meta` for RRv7's channel. We resolve the descriptor lazily —
  // routes with function-valued `seo` need the loader data, which
  // is present inside RRv7's meta args.
  const meta: MetaFunction | undefined = page.seo
    ? (metaArgs) => {
        // The RRv7 `meta` args carry `params`, `location`, `matches`,
        // and the current match's `data`. Resolve the descriptor
        // against a plausible page context. The full <SeoHead />
        // recomputes independently — this channel is a bridge for
        // crawlers / third-party tooling only.
        const url = new URL(
          metaArgs.location.pathname + metaArgs.location.search,
          "http://placeholder/",
        );
        const request = new Request(url.toString());
        const currentMatch = metaArgs.matches.find(
          (m) => m.id === (metaArgs as { id?: string }).id,
        );
        const seo = resolveValue(page.seo, {
          data: currentMatch?.data,
          params: metaArgs.params,
          matches: [] as never,
          request,
          url,
        }) as ISeoDescriptor | undefined;
        return extractBasicMetaTags(seo) as ReturnType<MetaFunction>;
      }
    : undefined;

  // Loader — wrap `page.load` in an RRv7 `LoaderFunction`. Layouts
  // don't own data, so we skip loaders for the layout kind.
  const loader =
    kind === "page" && typeof page.load === "function"
      ? (loaderArgs: LoaderFunctionArgs): unknown => {
          return (
            page.load as (args: {
              readonly params: Readonly<Record<string, string>>;
              readonly request: Request;
            }) => unknown
          )({
            params: loaderArgs.params as Readonly<Record<string, string>>,
            request: loaderArgs.request,
          });
        }
      : undefined;

  // `handle[STACKRA_HANDLE]` — the private bag. This holds every
  // framework-owned field that isn't a first-class RRv7 concept.
  const stackraHandle = {
    seo: page.seo,
    guards: page.guards,
    middleware: page.middleware,
    history: page.history,
    slots: {
      Pending: page.PendingComponent,
      Loading: page.LoadingComponent,
      Error: page.ErrorComponent,
      NotFound: page.NotFoundComponent,
      Empty: page.EmptyComponent,
    },
    isEmpty: page.isEmpty,
    // Layouts don't have a `mode` / `overlay` / `access` config on
    // their type — accessing via `page` still yields `undefined` for
    // those fields since `ILayoutConfig` doesn't declare them.
    mode: (page as { mode?: unknown }).mode,
    overlay: (page as { overlay?: unknown }).overlay,
    head: page.head,
    announce: page.announce,
    access: page.access,
    revalidate: page.revalidate,
    invalidateOn: page.invalidateOn,
    // Analytics is page-only — layouts don't fire per-navigation
    // events, so read from `page.analytics` where present.
    analytics: (page as { analytics?: unknown }).analytics,
  };

  // The RRv7 `handle` bag itself. `breadcrumb` and `analytics` live at
  // the top level because community tooling reads them from the well-
  // known `handle` fields; every other Stackra concern goes under the
  // private symbol.
  const handle: Record<string | symbol, unknown> = {
    breadcrumb: page.breadcrumb,
    // Analytics is a top-level `handle` field the framework hook
    // reads directly — but only for page kind.
    ...(kind === "page" && (page as { analytics?: unknown }).analytics !== undefined
      ? { analytics: (page as { analytics?: unknown }).analytics }
      : {}),
    [STACKRA_HANDLE]: stackraHandle,
  };

  return {
    // Component is a plain React component; RRv7 renders it directly.
    Component,
    HydrateFallback: page.LoadingComponent,
    ErrorBoundary: page.ErrorComponent,
    loader,
    meta,
    handle,
  } as RouteObject;
}
