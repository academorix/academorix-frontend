/**
 * @file index.ts
 * @module @stackra/routing/core/errors
 * @description Public API barrel for the `errors/` category.
 *
 *   Holds only framework-general routing errors. Subsystem-specific
 *   errors (like `MiddlewareCycleDetectedError`) live under their own
 *   subsystem — see `@/middleware/errors/`.
 */

export { RouteNotFoundError } from "./route-not-found.error";
export { UnmatchedRouteError } from "./unmatched-route.error";
