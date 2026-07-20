/**
 * @file adapt-layout-module.util.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Turn a Stackra `ILayoutModule` into an RRv7
 *   `RouteObject`.
 *
 *   Mirrors `adaptPageModule` but drops fields that don't apply to
 *   layouts — no `load`, no `analytics`, no `mode` / `overlay`.
 *   Layouts wrap children in a shell and don't own data.
 */

import type { ComponentType } from "react";
import type { RouteObject } from "react-router";
import type { IPageConfig } from "@stackra/contracts";

import { buildRouteObject } from "./build-route-object.util";
import type { ILayoutModule } from "./page-module.interface";

/**
 * Adapt a `ILayoutModule` to an RRv7 `RouteObject`.
 *
 * @param module - Layout module (`{default, layout}`).
 * @returns RRv7 route object with `handle[STACKRA_HANDLE]` populated.
 */
export function adaptLayoutModule(module: ILayoutModule): RouteObject {
  // `layout` is typed `unknown` at the contract level — narrow via a
  // safe cast so the config still resolves fields the adapter knows
  // about.
  const layout = (module.layout ?? {}) as IPageConfig;
  const Component: ComponentType | undefined = module.default;

  return buildRouteObject({
    Component,
    page: layout,
    kind: "layout",
  });
}
