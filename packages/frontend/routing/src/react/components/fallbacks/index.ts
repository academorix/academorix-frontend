/**
 * @file index.ts
 * @module @stackra/routing/react/components/fallbacks
 * @description Barrel for the framework-default route fallbacks.
 *
 *   Each fallback ships as its own kebab-case folder with an
 *   `interface.ts` for its props and a `component.tsx` for the
 *   implementation. Consumers override any single slot via
 *   `RoutingModule.forRoot({fallbacks: {...}})`, or import the
 *   component directly to compose a custom shell.
 */

export {
  DefaultLoadingFallback,
  type IDefaultLoadingFallbackProps,
} from "./default-loading-fallback";
export {
  DefaultPendingFallback,
  type IDefaultPendingFallbackProps,
} from "./default-pending-fallback";
export {
  DefaultEmptyFallback,
  type IDefaultEmptyFallbackAction,
  type IDefaultEmptyFallbackProps,
} from "./default-empty-fallback";
export {
  DefaultNotFoundFallback,
  type IDefaultNotFoundFallbackAction,
  type IDefaultNotFoundFallbackProps,
} from "./default-not-found-fallback";
export { DefaultErrorFallback } from "./default-error-fallback";
