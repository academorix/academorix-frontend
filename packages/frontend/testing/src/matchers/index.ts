/**
 * @file index.ts
 * @module @stackra/testing/matchers
 * @description Vitest custom matchers. Currently a stub — no custom
 *   matchers are shipped. `registerAllMatchers()` is provided as a
 *   no-op so consumer test files that call it stay compatible.
 *
 *   Add matchers here when the framework grows a shared assertion
 *   vocabulary (e.g. `expect(mock).toHaveBeenEmitted(EVENT_NAME)`).
 */

/**
 * Register every custom Vitest matcher shipped by @stackra/testing.
 *
 * Currently a no-op — this stub exists so tests written against the
 * fuller-featured version of this package don't need to change.
 */
export function registerAllMatchers(): void {
  // Intentionally empty — add `expect.extend({...})` calls here as
  // shared matchers get introduced.
}
