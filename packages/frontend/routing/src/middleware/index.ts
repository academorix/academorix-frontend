/**
 * @file index.ts
 * @module @stackra/routing/middleware
 * @description Public API barrel for the routing middleware subsystem.
 */

// ── Module ──
export { MiddlewareModule } from "./middleware.module";

// ── Services ──
export {
  MiddlewareRegistryService,
  MiddlewareResolverService,
  MiddlewareLoaderService,
} from "./services";

// ── Signals + helpers ──
export {
  RedirectSignal,
  NotFoundSignal,
  MiddlewareAbortSignal,
  redirect,
  notFound,
  abort,
} from "./signals";

// ── Errors ──
export { MiddlewareCycleDetectedError } from "./errors";
