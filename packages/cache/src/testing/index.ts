/**
 * @file index.ts
 * @module @stackra/cache/testing
 * @description Public API for `@stackra/cache/testing`.
 *
 *   Assertable mock cache manager + store, following the standard testing
 *   pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockCache } from '@stackra/cache/testing';
 *
 * const cache = createMockCache();
 * const store = cache.store();
 * await store.set('key', 'value');
 * expect(await store.get('key')).toBe('value');
 * expect(cache.$.wasCalledWith('store')).toBe(true);
 * ```
 */

export { MockCacheManager } from "./mock-cache-manager";
export { MockCacheStore } from "./mock-cache-store";
export { createMockCache, createMockCacheStore } from "./create-mock-cache";
