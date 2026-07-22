/**
 * @file index.ts
 * @module @stackra/actions/core/pipeline
 * @description Public API barrel for the `pipeline` category — re-exports the
 *   dispatch pipeline's built-in middleware (authorization, logging, tracing)
 *   and the `IMiddlewarePassable` payload contract every middleware receives.
 */

export { AuthorizeMiddleware } from "./authorize.middleware";
export { LogMiddleware } from "./log.middleware";
export { TraceMiddleware } from "./trace.middleware";
export type { IMiddlewarePassable } from "./middleware-passable.interface";
