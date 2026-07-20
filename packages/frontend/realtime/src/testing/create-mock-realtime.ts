/**
 * @file create-mock-realtime.ts
 * @module @stackra/realtime/testing
 * @description Factories returning assertable realtime mocks.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockRealtimeManager } from "./mock-realtime-manager";
import { MockRealtimeConnection } from "./mock-realtime-connection";

/**
 * Create an assertable mock realtime manager.
 *
 * @example
 * ```ts
 * const rt = createMockRealtime();
 * const conn = await rt.connection();
 * const channel = conn.channel('orders');
 * channel.on('created', spy);
 * conn.simulateIncoming('orders', 'created', { id: '42' });
 * expect(spy).toHaveBeenCalledWith({ id: '42' });
 * ```
 */
export function createMockRealtime(): AssertableProxy<MockRealtimeManager> {
  return createAssertableProxy(new MockRealtimeManager());
}

/**
 * Create an assertable mock realtime connection — for tests that only
 * need a single connection without a manager wrapper.
 */
export function createMockRealtimeConnection(): AssertableProxy<MockRealtimeConnection> {
  return createAssertableProxy(new MockRealtimeConnection());
}
