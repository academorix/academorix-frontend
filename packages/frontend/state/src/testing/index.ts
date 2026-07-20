/**
 * @file index.ts
 * @module @stackra/state/testing
 * @description Public API for `@stackra/state/testing`.
 *
 *   Assertable mock state registry following the standard testing pattern
 *   used across the Stackra monorepo.
 *
 * @example
 * ```ts
 * import { createMockStateRegistry } from '@stackra/state/testing';
 *
 * const registry = createMockStateRegistry();
 * registry.registerStore('theme', THEME_STORE, store);
 * expect(registry.getNames()).toEqual(['theme']);
 * ```
 */

export { MockStateRegistry, type MockStoreEntry } from './mock-state-registry';
export { createMockStateRegistry } from './create-mock-state-registry';
