/**
 * @file mock-lock-manager.ts
 * @module @stackra/coordinator/testing
 * @description In-memory mock of `LockManager`.
 *
 *   Uses a JS-level `Map<string, Promise<void>>` to enforce mutual
 *   exclusion within the current process — good enough to exercise
 *   consumer code that relies on `run()` serialising execution.
 */

import type { ILockOptions } from "@/core/interfaces";

/**
 * In-memory lock manager for testing.
 *
 * Locks are queued per-name so callers observe the same serialisation
 * semantics as production. Timeouts fire via `setTimeout` and reject
 * with an `Error` — tests can catch that to verify timeout paths.
 */
export class MockLockManager {
  /** Queue tail per lock name — resolves when the current holder releases. */
  private readonly queues = new Map<string, Promise<void>>();

  /** Names of locks currently held — inspectable by tests. */
  public readonly heldLocks = new Set<string>();

  public async run<T>(
    name: string,
    callback: () => Promise<T> | T,
    options: ILockOptions = {},
  ): Promise<T> {
    const previous = this.queues.get(name) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.queues.set(name, current);

    // Wait for the previous holder, respecting timeout.
    try {
      await this.awaitWithTimeout(previous, options.timeoutMs, name);
    } catch (error) {
      // Failed to acquire — hand control back but reset the queue so
      // subsequent callers don't stall on our aborted attempt.
      release();
      if (this.queues.get(name) === current) this.queues.delete(name);
      throw error;
    }

    this.heldLocks.add(name);
    try {
      return await callback();
    } finally {
      this.heldLocks.delete(name);
      release();
      if (this.queues.get(name) === current) this.queues.delete(name);
    }
  }

  public async isLocked(name: string): Promise<boolean> {
    return this.heldLocks.has(name);
  }

  /** Drop every queued/held lock — for cross-test cleanup. */
  public reset(): void {
    this.queues.clear();
    this.heldLocks.clear();
  }

  private awaitWithTimeout(
    previous: Promise<void>,
    timeoutMs: number | undefined,
    name: string,
  ): Promise<void> {
    if (!timeoutMs || timeoutMs <= 0) return previous;
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`MockLockManager: lock "${name}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      previous.then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}
