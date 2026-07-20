/**
 * @file expect-matched.util.ts
 * @module @stackra/routing/testing
 * @description Assertion helper — checks that a route with the
 *   given id (or path) is in the router's match chain.
 */

import type { ITestRouter } from "./create-test-router.util";

/**
 * Assert that a route with `routeIdOrPath` is currently matched.
 *
 * @param router - Test router.
 * @param routeIdOrPath - Route id (assigned via `defineRoute({id: '...'})`)
 *   OR the route's declared path.
 * @throws {Error} When the id / path is absent from the match chain.
 *
 * @example
 * ```typescript
 * expectMatched(router, 'dashboard');
 * expectMatched(router, '/users/:id');
 * ```
 */
export function expectMatched(router: ITestRouter, routeIdOrPath: string): void {
  const matches = router.router.state.matches;
  // Data matches carry the route id on `match.route.id`. `pathname`
  // stays on the top-level match. Accept either as a lookup key.
  const found = matches.some(
    (match) => match.route.id === routeIdOrPath || match.pathname === routeIdOrPath,
  );
  if (!found) {
    const ids = matches.map((m) => m.route.id ?? m.pathname).join(", ");
    throw new Error(`expectMatched: '${routeIdOrPath}' not in match chain. Matched ids: [${ids}].`);
  }
}
