/**
 * @file create-mock-checkpoint-service.ts
 * @module @stackra/sync/testing
 * @description Factory returning an assertable mock checkpoint
 *   service.
 */

import { createAssertableProxy, type AssertableProxy } from "@stackra/testing";

import { MockCheckpointService } from "./mock-checkpoint-service";

/**
 * Create an assertable mock `CheckpointService`.
 *
 * @example
 * ```ts
 * const checkpoints = createMockCheckpointService();
 * await checkpoints.save('users', ...);
 * expect(checkpoints.$.wasCalledWith('save', 'users')).toBe(true);
 * ```
 */
export function createMockCheckpointService(): AssertableProxy<MockCheckpointService> {
  return createAssertableProxy(new MockCheckpointService());
}
