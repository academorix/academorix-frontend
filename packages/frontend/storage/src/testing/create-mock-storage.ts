/**
 * @file create-mock-storage.ts
 * @module @stackra/storage/testing
 * @description Factories returning `AssertableProxy` wrappers over
 *   `MockStorage` and `MockStorageManager` — the standard shape
 *   every workspace testing subpath ships.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import { MockStorage } from "./mock-storage";
import { MockStorageManager } from "./mock-storage-manager";

/**
 * Create an assertable mock `IStorage`.
 *
 * The returned instance:
 * - Implements the full `IStorage` contract in-memory.
 * - Records every method call for assertion via
 *   `mock.$.wasCalled(...)` / `mock.$.wasCalledWith(...)` /
 *   `mock.$.callCount(...)`.
 * - Supports return-value stubbing via `mock.$.stub(...)`.
 *
 * @returns An `AssertableProxy` wrapping a fresh `MockStorage`.
 *
 * @example
 * ```typescript
 * const storage = createMockStorage();
 * await storage.set('key', 'value');
 * expect(storage.$.wasCalledWith('set', 'key', 'value')).toBe(true);
 * ```
 */
export function createMockStorage(): AssertableProxy<MockStorage> {
  return createAssertableProxy(new MockStorage());
}

/**
 * Create an assertable mock `IStorageManager`.
 *
 * @returns An `AssertableProxy` wrapping a fresh `MockStorageManager`.
 *
 * @example
 * ```typescript
 * const manager = createMockStorageManager();
 * const store = manager.instance('preferences');
 * await store.set('theme', 'dark');
 * expect(manager.$.wasCalledWith('instance', 'preferences')).toBe(true);
 * ```
 */
export function createMockStorageManager(): AssertableProxy<MockStorageManager> {
  return createAssertableProxy(new MockStorageManager());
}
