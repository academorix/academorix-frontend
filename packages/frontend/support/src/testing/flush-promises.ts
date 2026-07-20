/**
 * @file flush-promises.ts
 * @module @stackra/support/testing
 * @description Helper to drain the microtask queue in tests.
 *
 *   Common pattern when a service performs a chain of awaited work
 *   asynchronously — e.g. `onModuleInit()` reading from an adapter and
 *   then hydrating internal state. Tests need to `await` the
 *   microtasks to observe the result.
 */

/**
 * Resolve after the microtask queue is drained.
 *
 * @param cycles - How many microtask ticks to wait. Default: `1`. Higher
 *   values are needed when a promise chain has multiple `await` points
 *   before observable state is written.
 *
 * @example
 * ```ts
 * service.doAsyncWork();
 * await flushPromises();
 * expect(service.isReady()).toBe(true);
 * ```
 */
export async function flushPromises(cycles = 1): Promise<void> {
  for (let index = 0; index < cycles; index += 1) {
    // `await Promise.resolve()` schedules the continuation as a
    // microtask, forcing the current pending microtasks to drain first.
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
}
