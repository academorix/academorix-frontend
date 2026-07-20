/**
 * @file index.ts
 * @module @stackra/realtime/testing
 * @description Public API for `@stackra/realtime/testing`.
 *
 *   Assertable mock realtime manager, connection, and channels,
 *   following the standard testing pattern used across the Stackra
 *   monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockRealtime } from '@stackra/realtime/testing';
 *
 * const rt = createMockRealtime();
 * const conn = await rt.connection();
 * const orders = conn.channel('orders');
 * orders.on('created', handler);
 * conn.simulateIncoming('orders', 'created', { id: '42' });
 * ```
 */

export { MockRealtimeManager } from './mock-realtime-manager';
export { MockRealtimeConnection } from './mock-realtime-connection';
export {
  MockRealtimeChannel,
  MockRealtimePresenceChannel,
  type RecordedWhisper,
} from './mock-realtime-channel';
export { createMockRealtime, createMockRealtimeConnection } from './create-mock-realtime';
