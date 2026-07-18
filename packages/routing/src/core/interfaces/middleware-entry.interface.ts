/**
 * @file middleware-entry.interface.ts
 * @module @stackra/routing/core/interfaces
 * @description Internal registry entry for a discovered middleware.
 *
 *   Held by `MiddlewareRegistryService`. The registry stores the
 *   ctor (never the instance) so the DI container resolves the
 *   instance at execution time — this keeps middleware
 *   compatible with `Scope.REQUEST` should we support scoped
 *   middleware later.
 */

import type { IMiddleware, IMiddlewareOptions } from "@stackra/contracts";

/**
 * A registered middleware entry.
 */
export interface IMiddlewareEntry {
  /** Options stamped by the `@Middleware(...)` decorator. */
  readonly options: IMiddlewareOptions;

  /**
   * Class constructor discovered in the DI graph. The registry keeps
   * the constructor (not the instance) so downstream services can
   * resolve the instance from the container at call time.
   */
  readonly ctor: new (...args: never[]) => IMiddleware;

  /**
   * Order in which the middleware was registered. Ties in priority
   * are broken by ascending declaration index.
   */
  readonly declarationIndex: number;
}
