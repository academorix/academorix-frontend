/**
 * @file create-mock-state-registry.ts
 * @module @stackra/state/testing
 * @description Factory returning an assertable mock state registry.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';
import { MockStateRegistry } from './mock-state-registry';

/**
 * Create an assertable mock state registry.
 *
 * @example
 * ```ts
 * const registry = createMockStateRegistry();
 * registry.registerStore('theme', THEME_STORE, store);
 * expect(registry.getNames()).toContain('theme');
 * expect(registry.$.wasCalled('registerStore')).toBe(true);
 * ```
 */
export function createMockStateRegistry(): AssertableProxy<MockStateRegistry> {
  return createAssertableProxy(new MockStateRegistry());
}
