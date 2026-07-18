/**
 * @file unmatched-route.error.ts
 * @module @stackra/routing/core/errors
 * @description Raised by `RouteMatcherService` when a request exhausts
 *   every registered route and none matches.
 *
 *   In normal SPA operation this is caught by RRv7's own 404 branch;
 *   the error class exists so tooling (devtools, tests, prerender
 *   walker) can pinpoint an unmatched route without wading through
 *   RRv7's own error shape.
 */

/**
 * Error raised when the route matcher exhausts every registered route
 * and none matches the incoming request.
 */
export class UnmatchedRouteError extends Error {
  /** Pathname the matcher tried to match. */
  public readonly pathname: string;

  /** Subdomain the matcher resolved (or `null` for apex). */
  public readonly subdomain: string | null;

  /**
   * @param pathname  - Pathname the matcher tried to match.
   * @param subdomain - Parsed subdomain (or `null` for the apex host).
   */
  public constructor(pathname: string, subdomain: string | null) {
    super(
      `No route matched: pathname='${pathname}', subdomain=${subdomain === null ? "<apex>" : `'${subdomain}'`}.`,
    );
    this.name = "UnmatchedRouteError";
    this.pathname = pathname;
    this.subdomain = subdomain;
  }
}
