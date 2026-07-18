/**
 * @file scheduler.service.ts
 * @module @stackra/scheduler/core/services
 * @description High-level scheduler orchestrator with event emission.
 *   Wraps a platform-specific `ITaskRunner` and emits lifecycle events
 *   via the optional `EventEmitter` from `@stackra/events`.
 */

import { Injectable, Inject, Optional } from '@stackra/container';
import { Logger } from '@stackra/logger';
import { TASK_RUNNER } from '@stackra/contracts';
import type { ITaskRunner, IScheduledTask, ITaskOptions } from '@/core/interfaces';
import { EVENT_EMITTER, SCHEDULER_EVENTS } from '@stackra/contracts';
import type { IEventEmitter } from '@stackra/contracts';

// ════════════════════════════════════════════════════════════════════════════════
// Re-export the canonical event names so existing consumers that
// import `SCHEDULER_EVENTS` from `@stackra/scheduler` keep working.
// New code should import directly from `@stackra/contracts`.
// ════════════════════════════════════════════════════════════════════════════════
export { SCHEDULER_EVENTS };
// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * High-level scheduler orchestrator.
 *
 * Wraps the injected `ITaskRunner` with lifecycle event emission and
 * a unified API. Services interact with this class, not the runner directly.
 *
 * @example
 * ```typescript
 * const scheduler = container.get<SchedulerService>(SCHEDULER_SERVICE);
 *
 * scheduler.register('sync-orders', async () => {
 *   await orderService.sync();
 * }, { interval: 60000, retries: 2 });
 *
 * scheduler.pause('sync-orders');
 * scheduler.resume('sync-orders');
 * await scheduler.runNow('sync-orders');
 * ```
 */
@Injectable()
export class SchedulerService {
  /** Scoped logger for fail-soft emit warnings. */
  private readonly logger = new Logger(SchedulerService.name);

  /**
   * @param runner - Platform-specific task runner (injected)
   * @param eventEmitter - Optional event emitter for lifecycle events
   */
  public constructor(
    @Inject(TASK_RUNNER) private readonly runner: ITaskRunner,
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter
  ) {}

  /**
   * Register a new scheduled task.
   *
   * Wraps the task function to emit lifecycle events on start/complete/fail.
   *
   * @param name - Unique task identifier
   * @param fn - Async function to execute on each interval
   * @param options - Scheduling configuration
   */
  public register(name: string, fn: () => Promise<void>, options: ITaskOptions): void {
    const wrappedFn = async (): Promise<void> => {
      this.emit(SCHEDULER_EVENTS.TASK_STARTED, { name });
      try {
        await fn();
        this.emit(SCHEDULER_EVENTS.TASK_COMPLETED, { name, timestamp: Date.now() });
      } catch (error: Error | any) {
        this.emit(SCHEDULER_EVENTS.TASK_FAILED, { name, error });
        throw error;
      }
    };

    this.runner.register(name, wrappedFn, options);
    this.emit(SCHEDULER_EVENTS.TASK_REGISTERED, { name, options });
  }

  /**
   * Unregister and stop a scheduled task.
   *
   * @param name - The task identifier to remove
   */
  public unregister(name: string): void {
    this.runner.unregister(name);
    this.emit(SCHEDULER_EVENTS.TASK_UNREGISTERED, { name });
  }

  /**
   * Execute a registered task immediately, outside its normal schedule.
   *
   * @param name - The task identifier to run
   * @returns A promise that resolves when the task completes
   */
  public async runNow(name: string): Promise<void> {
    return this.runner.runNow(name);
  }

  /**
   * Get all registered tasks and their current status.
   *
   * @returns Array of scheduled task descriptors
   */
  public getRegistered(): IScheduledTask[] {
    return this.runner.getRegistered();
  }

  /**
   * Pause a running task without unregistering it.
   *
   * @param name - The task identifier to pause
   */
  public pause(name: string): void {
    this.runner.pause(name);
    this.emit(SCHEDULER_EVENTS.TASK_PAUSED, { name });
  }

  /**
   * Resume a previously paused task.
   *
   * @param name - The task identifier to resume
   */
  public resume(name: string): void {
    this.runner.resume(name);
    this.emit(SCHEDULER_EVENTS.TASK_RESUMED, { name });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * Emit a scheduler lifecycle event on the optional event bus.
   *
   * Fail-soft: silently no-ops when no emitter is registered and
   * swallows synchronous errors thrown by listeners so a misbehaving
   * subscriber can never break scheduling.
   *
   * @param event - Event name (from `SCHEDULER_EVENTS`).
   * @param payload - Event payload.
   */
  private emit(event: string, payload: Record<string, unknown>): void {
    if (!this.eventEmitter) return;
    try {
      void this.eventEmitter.emit(event, payload);
    } catch (error: unknown) {
      this.logger.warn('[SchedulerService] failed to emit event', { event, error });
    }
  }
}
