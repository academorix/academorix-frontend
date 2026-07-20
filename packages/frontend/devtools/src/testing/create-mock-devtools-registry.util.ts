/**
 * @file create-mock-devtools-registry.util.ts
 * @module @stackra/devtools/testing
 * @description Factory returning an assertable
 *   `MockDevtoolsPanelsRegistry`. Wraps the raw mock in
 *   `createAssertableProxy` so tests can call
 *   `registry.$.wasCalledWith('register', panel)` etc.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import { MockDevtoolsPanelsRegistry } from "./mock-devtools-panels-registry";

/**
 * Build an assertable {@link MockDevtoolsPanelsRegistry}.
 *
 * @example
 * ```typescript
 * const registry = createMockDevtoolsRegistry();
 * registry.register(panel);
 * expect(registry.$.wasCalledWith('register', panel)).toBe(true);
 * ```
 */
export function createMockDevtoolsRegistry(): AssertableProxy<MockDevtoolsPanelsRegistry> {
  return createAssertableProxy(new MockDevtoolsPanelsRegistry());
}
