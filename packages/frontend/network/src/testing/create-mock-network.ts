/**
 * @file create-mock-network.ts
 * @module @stackra/network/testing
 * @description Factory returning an assertable mock network service.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockNetworkService } from "./mock-network-service";
import type { INetworkStatus } from "@stackra/contracts";

/**
 * Create an assertable mock network service.
 *
 * @example
 * ```ts
 * const network = createMockNetwork({ isOnline: true, type: 'wifi' });
 * const spy = vi.fn();
 * network.subscribe(spy);
 * network.goOffline();
 * expect(spy).toHaveBeenCalledWith(expect.objectContaining({ isOnline: false }));
 * expect(network.$.wasCalled('subscribe')).toBe(true);
 * ```
 */
export function createMockNetwork(
  initial?: Partial<INetworkStatus>,
): AssertableProxy<MockNetworkService> {
  return createAssertableProxy(new MockNetworkService(initial));
}
