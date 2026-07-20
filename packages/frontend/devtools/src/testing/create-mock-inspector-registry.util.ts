/**
 * @file create-mock-inspector-registry.util.ts
 * @module @stackra/devtools/testing
 * @description Factory returning an assertable
 *   `MockDevtoolsInspectorRegistry`.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';

import { MockDevtoolsInspectorRegistry } from './mock-devtools-inspector-registry';

/**
 * Build an assertable {@link MockDevtoolsInspectorRegistry}.
 *
 * @example
 * ```typescript
 * const registry = createMockInspectorRegistry();
 * registry.register(source);
 * expect(registry.$.wasCalledWith('register', source)).toBe(true);
 * ```
 */
export function createMockInspectorRegistry(): AssertableProxy<MockDevtoolsInspectorRegistry> {
  return createAssertableProxy(new MockDevtoolsInspectorRegistry());
}
