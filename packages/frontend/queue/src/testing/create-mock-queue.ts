/**
 * @file create-mock-queue.ts
 * @module @stackra/queue/testing
 * @description Factory returning an assertable mock queue manager.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";
import { MockQueueManager } from "./mock-queue-manager";
import { MockQueueConnection } from "./mock-queue-connection";

/**
 * Create an assertable mock queue manager.
 *
 * @example
 * ```ts
 * const queue = createMockQueue();
 * await queue.dispatch('send-email', { to: 'a@b.com' });
 * expect(queue.$.wasCalledWith('dispatch', 'send-email', { to: 'a@b.com' })).toBe(true);
 * expect(queue.getAllDispatchedJobs()).toHaveLength(1);
 * ```
 */
export function createMockQueue(): AssertableProxy<MockQueueManager> {
  return createAssertableProxy(new MockQueueManager());
}

/**
 * Create an assertable mock queue connection — useful when you want to
 * exercise a single connection without a manager wrapper.
 */
export function createMockQueueConnection(): AssertableProxy<MockQueueConnection> {
  return createAssertableProxy(new MockQueueConnection());
}
