/**
 * @file create-mock-scheduler.ts
 * @module @stackra/scheduler/testing
 * @description Factories returning assertable scheduler mocks.
 */

import { createAssertableProxy, type AssertableProxy } from '@stackra/testing';
import { MockScheduler } from './mock-scheduler';
import { MockTaskRunner } from './mock-task-runner';

/**
 * Create an assertable mock scheduler.
 *
 * @example
 * ```ts
 * const scheduler = createMockScheduler();
 * const spy = vi.fn(async () => {});
 * scheduler.register('sync-orders', spy, { interval: 1000 });
 * await scheduler.runNow('sync-orders');
 * expect(spy).toHaveBeenCalledTimes(1);
 * expect(scheduler.$.wasCalledWith('register', 'sync-orders', spy, { interval: 1000 })).toBe(true);
 * ```
 */
export function createMockScheduler(): AssertableProxy<MockScheduler> {
  return createAssertableProxy(new MockScheduler());
}

/**
 * Create an assertable mock task runner — for tests that inject the
 * runner directly (bypassing `SchedulerService`).
 */
export function createMockTaskRunner(): AssertableProxy<MockTaskRunner> {
  return createAssertableProxy(new MockTaskRunner());
}
