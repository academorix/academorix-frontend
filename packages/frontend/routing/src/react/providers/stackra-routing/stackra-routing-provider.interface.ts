/**
 * @file stackra-routing-provider.interface.ts
 * @module @stackra/routing/react/providers/stackra-routing
 * @description Props interface for {@link StackraRoutingProvider}.
 */

import type { ReactNode } from "react";
import type { IApplication, IRouteRecord } from "@stackra/contracts";

/**
 * Props accepted by `<StackraRoutingProvider>`.
 */
export interface IStackraRoutingProviderProps {
  /**
   * DI container. Defaults to the global context set by
   * `ApplicationFactory.create(...)`. Pass explicitly for tests or
   * multi-container setups.
   */
  readonly app?: IApplication;

  /**
   * Explicit route tree. When omitted, the provider reads routes
   * from `ROUTE_REGISTRY` (populated by `RoutingModule.forRoot(...)`
   * + `RoutingModule.forFeature(...)`).
   */
  readonly routes?: readonly IRouteRecord[];

  /**
   * Which underlying router implementation to construct.
   *
   * - `'browser'` — `createBrowserRouter` (default for real apps).
   * - `'memory'` — `createMemoryRouter` (tests + SSR fallback).
   * - `'hash'` — `createHashRouter` (deep-link-restricted hosts).
   *
   * @default 'browser'
   */
  readonly kind?: "browser" | "memory" | "hash";

  /**
   * Options forwarded to `createBrowserRouter` /
   * `createMemoryRouter` / `createHashRouter` — `basename`,
   * `hydrationData`, `initialEntries`, ...
   */
  readonly opts?: unknown;

  /**
   * When `false`, the provider will NOT mount the internal
   * `<A11yAnnouncer />` at the root. Defaults to `true`.
   *
   * @default true
   */
  readonly a11yAnnouncer?: boolean;

  /**
   * Reserved for future use — will hold a global error boundary
   * once RRv7 formalises the API. Ignored today.
   */
  readonly fallback?: ReactNode;
}
