/**
 * @file index.ts
 * @module @stackra/error/router
 * @description React Router integration for the error system. Requires
 *   `react-router-dom` (optional peer) — kept in its own entry so the
 *   base `./react` bundle stays router-agnostic.
 */

export { RouteErrorBoundary } from "./route-error-boundary";
export type { IRouteErrorBoundaryProps } from "./route-error-boundary/route-error-boundary.component";
