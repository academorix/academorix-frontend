/**
 * @file create-mock-application.ts
 * @module @stackra/container/testing
 * @description Factory returning an assertable mock application context.
 */

import type { InjectionToken } from "@stackra/contracts";
import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockApplication } from "./mock-application";

/**
 * Create an assertable mock application context.
 *
 * Optionally accepts a set of initial `[token, value]` pairs to
 * pre-populate the registry — equivalent to calling `.provide()` for
 * each pair after construction.
 *
 * @example
 * ```ts
 * const app = createMockApplication([
 *   [LOGGER, createMockLogger()],
 *   [CACHE_MANAGER, createMockCache()],
 * ]);
 *
 * const logger = app.get(LOGGER);
 * expect(app.$.wasCalledWith('get', LOGGER)).toBe(true);
 * ```
 */
export function createMockApplication(
  providers?: ReadonlyArray<readonly [InjectionToken, unknown]>,
): AssertableProxy<MockApplication> {
  const app = new MockApplication();
  if (providers) {
    for (const [token, value] of providers) {
      app.provide(token, value);
    }
  }
  return createAssertableProxy(app);
}
