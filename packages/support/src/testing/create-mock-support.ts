/**
 * @file create-mock-support.ts
 * @module @stackra/support/testing
 * @description Factories returning assertable mock instances for the
 *   support-package primitives.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockManager } from "./mock-manager";
import { MockRegistry } from "./mock-registry";
import type { DriverCreator } from "../managers/manager";

/**
 * Create an assertable {@link MockManager<T>} — a working single-driver
 * manager that records `driver()` / `extend()` / `setDefaultDriver()`
 * calls for assertions.
 *
 * @example
 * ```ts
 * type ILogger = { log(msg: string): void };
 * const mgr = createMockManager<ILogger>({
 *   default: 'console',
 *   drivers: { console: () => ({ log: vi.fn() }) },
 * });
 * mgr.driver().log('hi');
 * expect(mgr.$.wasCalled('driver')).toBe(true);
 * ```
 */
export function createMockManager<T = unknown>(
  config: {
    default?: string;
    drivers?: Record<string, DriverCreator<T>>;
  } = {},
): AssertableProxy<MockManager<T>> {
  return createAssertableProxy(new MockManager<T>(config));
}

/**
 * Create an assertable {@link MockRegistry<K, V>} — a working strict
 * `BaseRegistry` that records every mutation.
 *
 * @example
 * ```ts
 * const registry = createMockRegistry<string, number>();
 * registry.register('a', 1);
 * expect(registry.$.wasCalledWith('register', 'a', 1)).toBe(true);
 * ```
 */
export function createMockRegistry<K, V>(
  seed?: Iterable<readonly [K, V]>,
): AssertableProxy<MockRegistry<K, V>> {
  return createAssertableProxy(new MockRegistry<K, V>(seed));
}
