/**
 * @file index.ts
 * @module @stackra/support/testing
 * @description Public API for `@stackra/support/testing`.
 *
 *   Test helpers for consumer packages that extend the base primitives
 *   `Manager<T>` and `BaseRegistry<K, V>`, plus a `flushPromises`
 *   utility for draining microtask queues.
 *
 *   - `MockManager<T>` — a working single-driver manager subclass with
 *     recorded `extend()` calls.
 *   - `MockRegistry<K, V>` — a working strict registry that records
 *     every register / replace / remove mutation.
 *   - `createMockManager()` / `createMockRegistry()` — assertable
 *     proxies (`mock.$.wasCalled()`, etc.) over the above.
 *   - `flushPromises()` — drain the microtask queue so async
 *     `onModuleInit` / `onApplicationBootstrap` side effects surface.
 *
 * @example
 * ```ts
 * import { createMockRegistry, flushPromises } from '@stackra/support/testing';
 *
 * const registry = createMockRegistry<string, number>();
 * registry.register('a', 1);
 * expect(registry.$.wasCalledWith('register', 'a', 1)).toBe(true);
 *
 * await flushPromises();
 * ```
 */

export { MockManager, type MockManagerExtendCall } from "./mock-manager";
export { MockRegistry, type RegistryMutation } from "./mock-registry";
export { createMockManager, createMockRegistry } from "./create-mock-support";
export { flushPromises } from "./flush-promises";
