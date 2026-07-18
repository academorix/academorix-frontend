/**
 * @file index.ts
 * @module @stackra/queue/testing
 * @description Public API for `@stackra/queue/testing`.
 *
 *   Assertable mock queue manager + connection, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockQueue } from '@stackra/queue/testing';
 *
 * const queue = createMockQueue();
 * await queue.dispatch('send-email', { to: 'user@example.com' });
 * expect(queue.$.wasCalledWith('dispatch', 'send-email', { to: 'user@example.com' })).toBe(true);
 * ```
 */

export { MockQueueManager } from "./mock-queue-manager";
export { MockQueueConnection, type RecordedJob } from "./mock-queue-connection";
export { createMockQueue, createMockQueueConnection } from "./create-mock-queue";
