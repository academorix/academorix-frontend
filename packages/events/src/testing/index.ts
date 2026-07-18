/**
 * @file index.ts
 * @module @stackra/events/testing
 * @description Public API for `@stackra/events/testing`.
 *
 *   Assertable mock event emitter, following the standard testing
 *   pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockEvents } from '@stackra/events/testing';
 *
 * const events = createMockEvents();
 * await events.emit('user.created', { id: '42' });
 * expect(events.$.wasCalledWith('emit', 'user.created', { id: '42' })).toBe(true);
 * ```
 */

export { MockEventEmitter, type RecordedEmit } from "./mock-event-emitter";
export { createMockEvents } from "./create-mock-events";
