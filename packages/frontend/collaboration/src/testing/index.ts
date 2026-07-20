/**
 * @file index.ts
 * @module @stackra/collaboration/testing
 * @description Public API for `@stackra/collaboration/testing`.
 *
 *   Assertable mock room manager + transport, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockRoomManager } from '@stackra/collaboration/testing';
 *
 * const rooms = createMockRoomManager();
 * const transport = rooms.getTransport();
 * await transport.connect('doc-42', 'user-1', { name: 'Alice' });
 * transport.broadcast('doc-42', 'cursor', { x: 100, y: 200 });
 * expect(transport.broadcasts).toHaveLength(1);
 * ```
 */

export { MockCollaborationTransport, type RecordedBroadcast } from "./mock-collaboration-transport";
export { MockRoomManager } from "./mock-room-manager";
export {
  createMockRoomManager,
  createMockCollaborationTransport,
} from "./create-mock-room-manager";
