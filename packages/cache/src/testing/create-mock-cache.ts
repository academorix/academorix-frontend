/**
 * @file create-mock-cache.ts
 * @module @stackra/cache/testing
 * @description Factory returning an assertable mock cache manager.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockCacheManager } from "./mock-cache-manager";
import { MockCacheStore } from "./mock-cache-store";

/**
 * Create an assertable mock cache manager.
 *
 * The returned instance:
 * - Implements the full `ICacheManager` contract (in-memory store).
 * - Records every method call for assertion via `mock.$.wasCalled()`,
 *   `mock.$.wasCalledWith()`, `mock.$.callCount()`.
 * - Supports return-value stubbing via `mock.$.stub()`.
 *
 * @example
 * ```ts
 * const cache = createMockCache();
 * const store = cache.store();
 * await store.set('user:1', { name: 'Ada' });
 * expect(await store.get('user:1')).toEqual({ name: 'Ada' });
 * expect(cache.$.wasCalledWith('store')).toBe(true);
 * ```
 */
export function createMockCache(): AssertableProxy<MockCacheManager> {
  return createAssertableProxy(new MockCacheManager());
}

/**
 * Create an assertable mock cache store — useful when you only need a
 * single store (not a full manager).
 */
export function createMockCacheStore(): AssertableProxy<MockCacheStore> {
  return createAssertableProxy(new MockCacheStore());
}
