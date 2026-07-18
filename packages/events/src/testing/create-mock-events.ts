/**
 * @file create-mock-events.ts
 * @module @stackra/events/testing
 * @description Factory returning an assertable mock event emitter.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockEventEmitter } from "./mock-event-emitter";

/**
 * Create an assertable mock event emitter.
 *
 * @example
 * ```ts
 * const events = createMockEvents();
 * const off = events.on('user.created', (payload) => { ... });
 * await events.emit('user.created', { id: '42' });
 * expect(events.$.wasCalledWith('emit', 'user.created', { id: '42' })).toBe(true);
 * expect(events.emittedEvents).toHaveLength(1);
 * off();
 * ```
 */
export function createMockEvents(): AssertableProxy<MockEventEmitter> {
  return createAssertableProxy(new MockEventEmitter());
}
