/**
 * @file route-error-boundary.component.tsx
 * @module @stackra/error/router
 * @description React Router `errorElement` integration.
 */

import type { ReactNode } from "react";

import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { normalizeError } from "../core/utils/normalize-error.util";
import { DefaultErrorFallback } from "../react/components/fallbacks/default-error-fallback.component";

/**
 * Props for {@link RouteErrorBoundary}.
 */
export interface IRouteErrorBoundaryProps {
  /** Show the raw stack trace. Defaults to `false`. */
  showDetails?: boolean;
}

/**
 * Drop-in `errorElement` for React Router routes. Reads the active route
 * error via `useRouteError`, distinguishing thrown `Response`s (404/500
 * loader/action errors) from ordinary thrown values, and renders the
 * full-page {@link DefaultErrorFallback}.
 *
 * Unlike component boundaries, this does not `reset` — recovery on a
 * route is a navigation concern owned by the router.
 *
 * @example
 * ```tsx
 * import { RouteErrorBoundary } from '@stackra/error/router';
 *
 * const routes = [
 *   { path: '/', element: <Home />, errorElement: <RouteErrorBoundary /> },
 * ];
 * ```
 *
 * @param props - {@link IRouteErrorBoundaryProps}.
 * @returns The fallback element.
 */
export function RouteErrorBoundary({ showDetails = false }: IRouteErrorBoundaryProps): ReactNode {
  const routeError = useRouteError();

  if (isRouteErrorResponse(routeError)) {
    const heading = `${routeError.status} ${routeError.statusText}`;
    return (
      <DefaultErrorFallback
        error={new Error(heading)}
        title={heading}
        description={typeof routeError.data === "string" ? routeError.data : undefined}
        showDetails={showDetails}
      />
    );
  }

  return <DefaultErrorFallback error={normalizeError(routeError)} showDetails={showDetails} />;
}
