/**
 * @file create-mock-tab-transport-manager.ts
 * @module @stackra/coordinator/testing
 * @description Factory returning an assertable mock tab transport
 *   manager.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import { MockTabTransportManager } from "./mock-tab-transport-manager";

/**
 * Create an assertable mock `ITabTransportManager`.
 *
 * The mock behaves like a real `TabTransportManager` — channels are
 * cached by name, broadcasts fan-out to every peer subscriber, and
 * `release(name)` closes + evicts. `isSupported()` defaults to `true`;
 * flip via `.simulateUnsupported()` to exercise the SSR fallback path.
 *
 * @example
 * ```ts
 * const manager = createMockTabTransportManager();
 * const channel = manager.channel('room:42');
 * channel.subscribe((msg) => { ... });
 * expect(manager.$.wasCalledWith('channel', 'room:42')).toBe(true);
 * ```
 */
export function createMockTabTransportManager(): AssertableProxy<MockTabTransportManager> {
  return createAssertableProxy(new MockTabTransportManager());
}
