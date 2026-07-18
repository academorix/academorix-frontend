/**
 * @file mock-queue-connection.ts
 * @module @stackra/queue/testing
 * @description In-memory `IQueueConnection` implementation for tests.
 *
 *   Records every dispatched job so tests can assert on
 *   `.dispatchedJobs` directly, and provides a working `pop()` so
 *   worker code can be exercised end-to-end without a real backend.
 */

import type { IQueueConnection } from "@/core/interfaces/queue-connection.interface";
import type { IJobOptions } from "@/core/interfaces/job-options.interface";
import type { IQueuedJob } from "@/core/interfaces/queued-job.interface";

/** Payload recorded for every `push()`/`later()`/`bulk()` call. */
export interface RecordedJob<T = unknown> {
  id: string;
  name: string;
  data: T;
  options?: IJobOptions;
  scheduledFor?: number;
  createdAt: number;
  queue: string;
}

/**
 * In-memory queue connection for testing.
 *
 * Implements the full `IQueueConnection` contract with in-memory
 * behaviour — jobs are appended to a per-queue list, IDs are
 * monotonically increasing, and `pop()` returns the next available
 * job (respecting `scheduledFor` delays).
 */
export class MockQueueConnection implements IQueueConnection {
  /** Every job ever dispatched, in chronological order. */
  public readonly dispatchedJobs: RecordedJob[] = [];

  /** Paused queue names — `pop()` returns null while paused. */
  private readonly pausedQueues = new Set<string>();

  /** Monotonic counter used to synthesise job IDs. */
  private counter = 0;

  public async push<T = unknown>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const id = this.nextId();
    this.dispatchedJobs.push({
      id,
      name,
      data,
      options,
      createdAt: Date.now(),
      queue: options?.queue ?? "default",
    });
    return id;
  }

  public async later<T = unknown>(
    delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    const id = this.nextId();
    this.dispatchedJobs.push({
      id,
      name,
      data,
      options,
      scheduledFor: Date.now() + delayMs,
      createdAt: Date.now(),
      queue: options?.queue ?? "default",
    });
    return id;
  }

  public async bulk<T = unknown>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>,
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      ids.push(await this.push(job.name, job.data, job.options));
    }
    return ids;
  }

  public async pop(queue: string = "default"): Promise<IQueuedJob | null> {
    if (this.pausedQueues.has(queue)) return null;
    const now = Date.now();
    const idx = this.dispatchedJobs.findIndex(
      (j) => j.queue === queue && (j.scheduledFor === undefined || j.scheduledFor <= now),
    );
    if (idx === -1) return null;
    const [recorded] = this.dispatchedJobs.splice(idx, 1);
    return {
      id: recorded.id,
      name: recorded.name,
      data: recorded.data,
      attempts: 0,
      maxAttempts: recorded.options?.tries ?? 1,
      queue: recorded.queue,
      createdAt: recorded.createdAt,
    };
  }

  public async size(queue?: string): Promise<number> {
    if (queue === undefined) return this.dispatchedJobs.length;
    return this.dispatchedJobs.filter((j) => j.queue === queue).length;
  }

  public async remove(jobId: string): Promise<void> {
    const idx = this.dispatchedJobs.findIndex((j) => j.id === jobId);
    if (idx !== -1) this.dispatchedJobs.splice(idx, 1);
  }

  public async pause(queue: string = "default"): Promise<void> {
    this.pausedQueues.add(queue);
  }

  public async resume(queue: string = "default"): Promise<void> {
    this.pausedQueues.delete(queue);
  }

  public async clear(queue?: string): Promise<void> {
    if (queue === undefined) {
      this.dispatchedJobs.length = 0;
      return;
    }
    for (let i = this.dispatchedJobs.length - 1; i >= 0; i--) {
      if (this.dispatchedJobs[i]!.queue === queue) {
        this.dispatchedJobs.splice(i, 1);
      }
    }
  }

  public async close(): Promise<void> {
    /* no-op — mock has no resources to release */
  }

  /** Convenience — drop the entire ledger and un-pause every queue. */
  public reset(): void {
    this.dispatchedJobs.length = 0;
    this.pausedQueues.clear();
    this.counter = 0;
  }

  private nextId(): string {
    this.counter += 1;
    return `mock-job-${this.counter}`;
  }
}
