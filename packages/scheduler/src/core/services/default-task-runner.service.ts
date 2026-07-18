/**
 * @file default-task-runner.service.ts
 * @module @stackra/scheduler/core/services
 * @description Interval and cron-based task runner for web and native foreground.
 *   Supports interval scheduling, cron expressions, overlap prevention,
 *   retry logic, lifecycle hooks, and optional single-server locking.
 */

import { Injectable } from '@stackra/container';
import type { ITaskRunner } from '@/core/interfaces';
import type { IScheduledTask } from '@/core/interfaces';
import type { ITaskOptions } from '@/core/interfaces';
import { getNextCronDelay } from '@/core/utils/cron-parser.util';
import type { ITaskEntry } from '@/core/interfaces/task-entry.interface';

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/** Internal representation of a registered task. */

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Default task runner — interval + cron support with lifecycle hooks.
 *
 * Works on both web and React Native for foreground tasks. Includes:
 * - Fixed interval scheduling (setInterval)
 * - Cron expression scheduling (computed next-run delay)
 * - Overlap prevention (skips if previous run is still active)
 * - Configurable retry with exponential re-execution on failure
 * - Lifecycle hooks (onBefore, onAfter, onSuccess, onFailure)
 * - Pause/resume without unregistering
 *
 * For background execution on mobile, use `ExpoTaskRunner` from
 * `@stackra/scheduler/native`.
 *
 * @example
 * ```typescript
 * const runner = new DefaultTaskRunner();
 *
 * // Interval-based
 * runner.register('heartbeat', async () => {
 *   await fetch('/api/heartbeat');
 * }, { interval: 30000, immediate: true });
 *
 * // Cron-based
 * runner.register('daily-report', async () => {
 *   await generateReport();
 * }, { cron: '0 3 * * *' }); // Daily at 3 AM
 * ```
 */
@Injectable()
export class DefaultTaskRunner implements ITaskRunner {
  /** Registered tasks keyed by name. */
  private readonly tasks = new Map<string, ITaskEntry>();

  // ══════════════════════════════════════════════════════════════════════════════
  // ITaskRunner Implementation
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Register a new scheduled task.
   *
   * @param name - Unique task identifier
   * @param fn - Async function to execute
   * @param options - Scheduling configuration (interval or cron)
   */
  public register(name: string, fn: () => Promise<void>, options: ITaskOptions): void {
    if (this.tasks.has(name)) {
      this.unregister(name);
    }

    const isCron = !!options.cron;
    const entry: ITaskEntry = { name, fn, options, isRunning: false, isPaused: false, isCron };
    this.tasks.set(name, entry);

    if (isCron) {
      this.scheduleCron(entry);
    } else if (options.interval) {
      this.startInterval(entry);
    }

    if (options.immediate) {
      void this.executeTask(entry);
    }
  }

  /**
   * Unregister and stop a scheduled task.
   *
   * @param name - The task identifier to remove
   */
  public unregister(name: string): void {
    const entry = this.tasks.get(name);
    if (!entry) return;
    this.clearTimer(entry);
    this.tasks.delete(name);
  }

  /**
   * Execute a registered task immediately.
   *
   * @param name - The task identifier to run
   * @throws Error if the task is not registered
   */
  public async runNow(name: string): Promise<void> {
    const entry = this.tasks.get(name);
    if (!entry) throw new Error(`Task "${name}" is not registered.`);
    await this.executeTask(entry);
  }

  /**
   * Get all registered tasks and their current status.
   *
   * @returns Array of task descriptors
   */
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

  /**
   * Pause a running task without unregistering it.
   *
   * @param name - The task identifier to pause
   */
  public pause(name: string): void {
    const entry = this.tasks.get(name);
    if (!entry || entry.isPaused) return;
    this.clearTimer(entry);
    entry.isPaused = true;
  }

  /**
   * Resume a previously paused task.
   *
   * @param name - The task identifier to resume
   */
  public resume(name: string): void {
    const entry = this.tasks.get(name);
    if (!entry || !entry.isPaused) return;
    entry.isPaused = false;
    if (entry.isCron) {
      this.scheduleCron(entry);
    } else if (entry.options.interval) {
      this.startInterval(entry);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Scheduling
  // ══════════════════════════════════════════════════════════════════════════════

  /** Start interval-based scheduling. */
  private startInterval(entry: ITaskEntry): void {
    this.clearTimer(entry);
    entry.timer = setInterval(() => {
      if (!entry.isPaused && !entry.isRunning) {
        void this.executeTask(entry);
      }
    }, entry.options.interval!);
  }

  /** Schedule next cron execution using computed delay. */
  private scheduleCron(entry: ITaskEntry): void {
    this.clearTimer(entry);
    const delayMs = getNextCronDelay(entry.options.cron!);
    if (delayMs === null) return; // No next run within 1 year

    entry.timer = setTimeout(() => {
      if (!entry.isPaused && !entry.isRunning) {
        void this.executeTask(entry).then(() => {
          // Schedule the next cron execution after completing
          if (!entry.isPaused && this.tasks.has(entry.name)) {
            this.scheduleCron(entry);
          }
        });
      } else {
        // Re-schedule if paused/running
        this.scheduleCron(entry);
      }
    }, delayMs);
  }

  /** Clear any active timer. */
  private clearTimer(entry: ITaskEntry): void {
    if (entry.timer) {
      clearInterval(entry.timer as ReturnType<typeof setInterval>);
      clearTimeout(entry.timer as ReturnType<typeof setTimeout>);
      entry.timer = undefined;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Execution with Hooks + Retry
  // ══════════════════════════════════════════════════════════════════════════════

  /** Execute a task with retry logic and lifecycle hooks. */
  private async executeTask(entry: ITaskEntry): Promise<void> {
    if (entry.isRunning) return; // Overlap prevention
    entry.isRunning = true;

    const hooks = entry.options.hooks;
    const maxRetries = entry.options.retries ?? 0;
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | undefined;

    // onBefore hook
    await this.invokeHook(hooks?.onBefore, entry.name);

    while (attempt <= maxRetries) {
      try {
        await entry.fn();
        entry.lastRun = Date.now();
        const duration = Date.now() - startTime;

        // onSuccess hook
        await this.invokeHook(hooks?.onSuccess, entry.name, duration);
        // onAfter hook
        await this.invokeHook(hooks?.onAfter, entry.name, duration);

        entry.isRunning = false;
        return;
      } catch (error: Error | any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        attempt++;
        if (attempt > maxRetries) break;
      }
    }

    // All retries exhausted — task failed
    const duration = Date.now() - startTime;
    await this.invokeHook(hooks?.onFailure, entry.name, lastError!);
    await this.invokeHook(hooks?.onAfter, entry.name, duration);

    entry.isRunning = false;
  }

  /** Safely invoke a lifecycle hook (swallow errors). */
  private async invokeHook(
    hook: ((...args: any[]) => void | Promise<void>) | undefined,
    ...args: unknown[]
  ): Promise<void> {
    if (!hook) return;
    try {
      await hook(...args);
    } catch {
      /* hooks must never break scheduling */
    }
  }
}
