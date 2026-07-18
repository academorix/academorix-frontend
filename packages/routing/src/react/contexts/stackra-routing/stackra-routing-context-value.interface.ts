/**
 * @file stackra-routing-context-value.interface.ts
 * @module @stackra/routing/react/contexts/stackra-routing
 * @description The React context value published by
 *   `<StackraRoutingProvider>`.
 *
 *   Every routing hook reads this context to reach the DI container,
 *   the merged config, and the constructed RRv7 router. The context
 *   default value is `null` so consumers can distinguish "outside
 *   provider" from "inside provider with no data" — the throwing
 *   hooks branch on that.
 */

import type { IApplication, IRoutingModuleOptions } from "@stackra/contracts";
// TYPES ONLY — `ReturnType<typeof createBrowserRouter>` produces the
// internal `Router$1` type without pulling in `@remix-run/router` as
// a hard peer.
import type { createBrowserRouter } from "react-router";

/**
 * The RRv7 data-router type — the return type of
 * `createBrowserRouter` / `createMemoryRouter` / `createHashRouter`.
 * All three share the same shape.
 */
export type IStackraRouter = ReturnType<typeof createBrowserRouter>;

/**
 * The stable shape of the routing provider's context value.
 *
 * Hooks that need the routing state read this context. When the value
 * is `null`, the caller is OUTSIDE `<StackraRoutingProvider>` — hooks
 * treat that as an error per PLAN v3.12.3.
 */
export interface IStackraRoutingContext {
  /** DI container the provider resolved. */
  readonly container: IApplication;

  /** Merged routing config (defaults + user override). */
  readonly config: IRoutingModuleOptions;

  /** The RRv7 data-router instance. */
  readonly router: IStackraRouter;
}
