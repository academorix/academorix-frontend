/**
 * @file mock-task-runner.ts
 * @module @stackra/scheduler/testing
 * @description In-memory `ITaskRunner` implementation for tests.
 *
 *   Tracks registered tasks without actually scheduling them — tests can
 *   drive execution via `runNow(name)` and inspect state through
 *   `.getRegistered()`. Pause/resume flags are respected so consumer
 *   code that observes them works correctly.
 */

import type { ITaskRunner, IScheduledTask, ITaskOptions } from '@/core/interfaces';

/** Internal entry — bundles the task function with its options and state. */
interface RunnerEntry {
  name: string;
  fn: () => Promise<void>;
  options: ITaskOptions;
  isRunning: boolean;
  isPaused: boolean;
  lastRun?: number;
}

/**
 * In-memory task runner for testing.
 *
 * No real timers are ever started — tests explicitly trigger execution
 * via `runNow(name)`. This keeps unit tests deterministic and fast.
 */
export class MockTaskRunner implements ITaskRunner {
  private readonly tasks = new Map<string, RunnerEntry>();

  public register(name: string, fn: () => Promise<void>, options: ITaskOptions): void {
    this.tasks.set(name, {
      name,
      fn,
      options,
      isRunning: false,
      isPaused: false,
    });
  }

  public unregister(name: string): void {
    this.tasks.delete(name);
  }

  public async runNow(name: string): Promise<void> {
    const entry = this.tasks.get(name);
    if (!entry) return;
    entry.isRunning = true;
    try {
      await entry.fn();
      entry.lastRun = Date.now();
    } finally {
      entry.isRunning = false;
    }
  }

  public getRegistered(): IScheduledTask[] {
    return Array.from(this.tasks.values()).map((entry) => ({
      name: entry.name,
      interval: entry.options.interval ?? 0,
      cron: entry.options.cron,
      lastRun: entry.lastRun,
      isRunning: entry.isRunning,
      isPaused: entry.isPaused,
    }));
  }

  public pause(name: string): void {
    const entry = this.tasks.get(name);
    if (entry) entry.isPaused = true;
  }

  public resume(name: string): void {
    const entry = this.tasks.get(name);
    if (entry) entry.isPaused = false;
  }

  /** Drop every registered task — usually invoked between tests. */
  public reset(): void {
    this.tasks.clear();
  }
}
