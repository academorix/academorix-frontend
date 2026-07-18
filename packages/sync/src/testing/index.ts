/**
 * @file index.ts
 * @module @stackra/sync/testing
 * @description Public API for `@stackra/sync/testing`.
 *
 *   Assertable mocks following the standard workspace testing
 *   pattern:
 *
 *   - `Mock*` — in-memory implementations of the sync services.
 *   - `createMock*` — factories that wrap the mocks in
 *     `createAssertableProxy` for call assertions.
 *
 * @example
 * ```ts
 * import { createMockCheckpointService } from '@stackra/sync/testing';
 *
 * const checkpoints = createMockCheckpointService();
 * await checkpoints.save('users', ...);
 * expect(checkpoints.$.wasCalledWith('save', 'users')).toBe(true);
 * ```
 */

export { MockCheckpointService } from './mock-checkpoint-service';
export { createMockCheckpointService } from './create-mock-checkpoint-service';
