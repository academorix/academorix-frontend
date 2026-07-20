/**
 * @file mock-scheduler.ts
 * @module @stackra/scheduler/testing
 * @description In-memory scheduler surface mirroring `SchedulerService`.
 *
 *   Delegates to a `MockTaskRunner` under the hood so tests can inspect
 *   registered tasks via `.getRegistered()` and drive execution with
 *   `.runNow(name)`.
 */

import type { IScheduledTask, ITaskOptions } from "@/core/interfaces";
import { MockTaskRunner } from "./mock-task-runner";

/**
 * Assertable-friendly mock scheduler.
 *
 * API mirrors `SchedulerService` — same method names, same signatures,
 * no lifecycle event emission. Tests can pair this with
 * `createMockEvents()` if they need to assert on lifecycle events.
 */
export class MockScheduler {
  /** Underlying runner — exposed so tests can access `getRegistered()` state directly. */
  public readonly runner: MockTaskRunner = new MockTaskRunner();

  public register(name: string, fn: () => Promise<void>, options: ITaskOptions): void {
    this.runner.register(name, fn, options);
  }

  public unregister(name: string): void {
    this.runner.unregister(name);
  }

  public async runNow(name: string): Promise<void> {
    return this.runner.runNow(name);
  }

  public getRegistered(): IScheduledTask[] {
    return this.runner.getRegistered();
  }

  public pause(name: string): void {
    this.runner.pause(name);
  }

  public resume(name: string): void {
    this.runner.resume(name);
  }

  /** Drop every registered task. */
  public reset(): void {
    this.runner.reset();
  }
}
