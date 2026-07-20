/**
 * @file expect-guard-blocked.util.ts
 * @module @stackra/routing/testing
 * @description Assertion helper — checks that a guard blocked the
 *   most recent transition.
 *
 *   The framework converts a guard `redirect` decision to an RRv7
 *   `redirect(...)` throw (Response with 302 + Location header), a
 *   `notFound` decision to a 404 Response, and a `deny` decision to
 *   a 403 Response. The router surfaces these via `errors` on the
 *   match state.
 *
 *   `expectGuardBlocked` reads `router.state.errors` and asserts a
 *   guard-shaped error is present for the named guard.
 */

import type { ITestRouter } from "./create-test-router.util";

/**
 * Assert that a guard blocked the last transition.
 *
 * @param router - Test router.
 * @param guardHint - Optional string that must appear in the error
 *   message. Useful for named guards (e.g. `'auth'`); leave omitted
 *   to assert any guard-shaped block.
 * @throws {Error} When no guard-shaped block is present.
 *
 * @example
 * ```typescript
 * await router.navigate('/dashboard');
 * expectGuardBlocked(router, 'auth');
 * ```
 */
export function expectGuardBlocked(router: ITestRouter, guardHint?: string): void {
  const errors = router.router.state.errors ?? {};
  const errorValues = Object.values(errors);

  if (errorValues.length === 0) {
    throw new Error("expectGuardBlocked: no errors on the router — the transition succeeded.");
  }

  // Guard blocks arrive as `Response` values with 3xx / 4xx status,
  // or as `Error` instances thrown from the guard body.
  const blocked = errorValues.some((error) => {
    if (error instanceof Response) {
      return error.status >= 300 && error.status < 500;
    }
    if (error instanceof Error) {
      if (!guardHint) return true;
      return error.message.includes(guardHint);
    }
    return false;
  });

  if (!blocked) {
    throw new Error(
      `expectGuardBlocked: no guard-shaped error found${guardHint ? ` matching '${guardHint}'` : ""}.`,
    );
  }
}
