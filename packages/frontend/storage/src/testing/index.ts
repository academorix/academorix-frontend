/**
 * @file index.ts
 * @module @stackra/storage/testing
 * @description Public API for `@stackra/storage/testing`.
 *
 *   Assertable mocks following the standard workspace testing
 *   pattern:
 *
 *   - `Mock*` — in-memory implementations of the interface contracts.
 *   - `createMock*` — factories that wrap the mocks in
 *     `createAssertableProxy` (so tests can assert `$.wasCalled(...)`
 *     et al.).
 *
 * @example
 * ```typescript
 * import { createMockStorageManager } from '@stackra/storage/testing';
 *
 * const manager = createMockStorageManager();
 * await manager.instance('prefs').set('theme', 'dark');
 * expect(manager.$.wasCalledWith('instance', 'prefs')).toBe(true);
 * ```
 */

export { MockStorage } from './mock-storage';
export { MockStorageManager } from './mock-storage-manager';
export { createMockStorage, createMockStorageManager } from './create-mock-storage';
