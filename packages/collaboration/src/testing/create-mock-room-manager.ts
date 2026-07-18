/**
 * @file create-mock-room-manager.ts
 * @module @stackra/collaboration/testing
 * @description Factories returning assertable collaboration mocks.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';
import { MockRoomManager } from './mock-room-manager';
import { MockCollaborationTransport } from './mock-collaboration-transport';

/**
 * Create an assertable mock room manager.
 *
 * @example
 * ```ts
 * const rooms = createMockRoomManager();
 * const transport = rooms.getTransport();
 * await transport.connect('doc-42', 'user-1', { name: 'Alice' });
 * expect(rooms.$.wasCalled('getTransport')).toBe(true);
 * expect(transport.getMembers('doc-42')).toHaveLength(1);
 * ```
 */
export function createMockRoomManager(): AssertableProxy<MockRoomManager> {
  return createAssertableProxy(new MockRoomManager());
}

/**
 * Create an assertable mock collaboration transport — for tests that
 * bypass the room manager and interact with the transport directly.
 */
export function createMockCollaborationTransport(): AssertableProxy<MockCollaborationTransport> {
  return createAssertableProxy(new MockCollaborationTransport());
}
