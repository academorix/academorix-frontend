/**
 * @file index.ts
 * @module @stackra/routing/middleware/errors
 * @description Public API barrel for middleware-subsystem errors.
 *
 *   `MiddlewareCycleDetectedError` lives here because it is raised
 *   solely by `MiddlewareResolverService`. The class is re-exported
 *   from the middleware subsystem barrel and, through it, from the
 *   package root — consumers importing it via `@stackra/routing` still
 *   see the same symbol name.
 */

export { MiddlewareCycleDetectedError } from "./middleware-cycle-detected.error";
