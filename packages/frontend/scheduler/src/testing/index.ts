/**
 * @file index.ts
 * @module @stackra/scheduler/testing
 * @description Public API for `@stackra/scheduler/testing`.
 *
 *   Assertable mock scheduler + task runner, following the standard
 *   testing pattern used across the Stackra monorepo:
 *   - `mock-*.ts` — in-memory implementations of the interface contracts
 *   - `create-mock-*.ts` — factories that wrap mocks in `createAssertableProxy`
 *   - `index.ts` — barrel re-exports
 *
 * @example
 * ```ts
 * import { createMockScheduler } from '@stackra/scheduler/testing';
 *
 * const scheduler = createMockScheduler();
 * scheduler.register('sync-orders', async () => {}, { interval: 1000 });
 * expect(scheduler.getRegistered()).toHaveLength(1);
 * expect(scheduler.$.wasCalled('register')).toBe(true);
 * ```
 */

export { MockScheduler } from "./mock-scheduler";
export { MockTaskRunner } from "./mock-task-runner";
export { createMockScheduler, createMockTaskRunner } from "./create-mock-scheduler";
