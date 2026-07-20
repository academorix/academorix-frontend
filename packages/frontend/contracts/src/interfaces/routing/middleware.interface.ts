/**
 * @file middleware.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Runtime contract implemented by every middleware class.
 *
 *   NOTE: This is the ROUTING middleware contract — distinct from
 *   `IMiddlewareContext` / `IMiddlewareNext` defined for pipeline
 *   modules elsewhere in contracts. Routing middleware compiles down
 *   to the same execution shape at runtime.
 */

import type { IApplication } from "../container";
import type { IMatchDescriptor } from "./match-descriptor.interface";

/**
 * Runtime context passed to a routing middleware's `handle(ctx, next)`.
 */
export interface IMiddlewareContext<TState = Record<string, unknown>> {
  /** The active `Request`. */
  readonly request: Request;

  /** Parsed URL — convenience over `new URL(request.url)`. */
  readonly url: URL;

  /** Path params for the matched route. */
  readonly params: Readonly<Record<string, string>>;

  /** Match chain — every match up to (and including) the current route. */
  readonly matches: readonly IMatchDescriptor[];

  /** DI container — dependency lookups from within the middleware. */
  readonly container: IApplication;

  /** Shared mutable state bag. */
  state: TState;
}

/**
 * "Advance the pipeline" callback. Middleware calls `next()` to hand
 * off to the following middleware; the returned value is whatever the
 * inner pipeline eventually resolves to.
 */
export interface IMiddlewareNext {
  (): Promise<unknown>;
}

/**
 * Contract implemented by a routing middleware class.
 */
export interface IMiddleware {
  /**
   * Handle the request and hand off to `next()` when done.
   *
   * @param ctx - Middleware context (request, url, params, state).
   * @param next - Callback that advances the pipeline.
   * @returns Whatever the inner pipeline resolves to.
   */
  handle(ctx: IMiddlewareContext, next: IMiddlewareNext): Promise<unknown>;
}
