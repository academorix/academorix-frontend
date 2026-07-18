/**
 * @file expect-route.util.ts
 * @module @stackra/routing/testing
 * @description Assertion helper — checks that a test router's
 *   current path matches an expected pattern.
 */

import type { ITestRouter } from "./create-test-router.util";

/**
 * Assert that the router's current pathname matches the given
 * pattern. The pattern can be an exact string, a `*` wildcard
 * suffix, or a `RegExp`.
 *
 * @param router  - Test router built via `createTestRouter(...)`.
 * @param pattern - Expected pathname pattern.
 * @throws {Error} When the current pathname doesn't match.
 *
 * @example
 * ```typescript
 * expectRoute(router, '/dashboard');
 * expectRoute(router, '/users/*');
 * expectRoute(router, /^\/blog\//);
 * ```
 */
export function expectRoute(router: ITestRouter, pattern: string | RegExp): void {
  const current = router.pathname();
  if (pattern instanceof RegExp) {
    if (!pattern.test(current)) {
      throw new Error(`expectRoute: router is at '${current}', expected match for ${pattern}.`);
    }
    return;
  }
  // String — either exact match or a trailing `*` wildcard.
  if (pattern.endsWith("*")) {
    const prefix = pattern.slice(0, -1);
    if (!current.startsWith(prefix)) {
      throw new Error(`expectRoute: router is at '${current}', expected prefix '${prefix}'.`);
    }
    return;
  }
  if (current !== pattern) {
    throw new Error(`expectRoute: router is at '${current}', expected '${pattern}'.`);
  }
}
