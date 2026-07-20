/**
 * @file page-module.interface.ts
 * @module @stackra/routing/react/adapt-page-module
 * @description Runtime shape of a page module that exports a
 *   `definePage()` config alongside a default component export.
 *
 *   `adaptPageModule(module)` reads this shape and produces an RRv7
 *   `RouteObject` under the hood.
 */

import type { ComponentType } from "react";
import type { IPageConfig } from "@stackra/contracts";

/**
 * A page module — the shape every page-file default-exports.
 *
 * @typeParam TData - Return type of `page.load(...)`.
 * @typeParam TParams - Path param bag.
 */
export interface IPageModule<TData = unknown, TParams = Record<string, string>> {
  /** The React component rendered when the route matches. */
  readonly default: ComponentType;

  /** The `definePage(...)` config export. */
  readonly page: IPageConfig<TData, TParams>;
}

/**
 * A layout module — the shape every layout-file default-exports.
 */
export interface ILayoutModule {
  /** The React component that wraps children (`<Outlet />` inside). */
  readonly default: ComponentType;

  /**
   * The `defineLayout(...)` config export. Typed loosely as `unknown`
   * because the adapter reads only the fields it recognises — same
   * approach we take on the page config.
   */
  readonly layout: unknown;
}
