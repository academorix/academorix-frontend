/**
 * @file worker.service.ts
 * @module @stackra/queue/core/services
 * @description Poll-based job consumer with retry, timeout, and dead-letter routing.
 *   Polls a queue connection for available jobs and executes them through
 *   registered processor handlers. Manages the full job lifecycle.
 */

import { Injectable } from "@stackra/container";
import type { IQueueConnection, IQueuedJob, IWorkerOptions, JobHandler } from "@/core/interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Poll-based worker that consumes jobs from a queue connection.
 *
 * Features:
 * - Configurable poll interval
 * - Exponential backoff retry
 * - Per-job timeout
 * - Dead-letter routing on max attempts exceeded
 * - Start/stop lifecycle
 *
 * @example
 * ```typescript
 * const worker = new Worker(connection, 'emails', handler, {
 *   tries: 3,
 *   backoffMs: 1000,
 *   timeoutMs: 30000,
 *   pollIntervalMs: 500,
 * });
 * worker.start();
 * ```
 */
@Injectable()
export class Worker {
  /** Whether the worker is currently running. */
  private running = false;

  /** Poll timer handle. */
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  /** Number of jobs processed since start. */
  private processedCount = 0;

  /**
   * @param connection - The queue connection to poll
   * @param queueName - The queue tube to consume from
   * @param handler - Job processor function
   * @param options - Worker configuration
   */
  public constructor(
    private readonly connection: IQueueConnection,
    private readonly queueName: string,
    private readonly handler: JobHandler,
    private readonly options: Required<IWorkerOptions>,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════════
  // Public API
  // ══════════════════════════════════════════════════════════════════════════════

  /** Start polling for jobs. */
  public start(): void {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  /** Stop polling. Already-running jobs complete naturally. */
  public stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /** Whether the worker is currently running. */
  public isRunning(): boolean {
    return this.running;
  }

  /** Number of jobs processed since start. */
  public getProcessedCount(): number {
    return this.processedCount;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Private — Poll Loop
  // ══════════════════════════════════════════════════════════════════════════════

  /** Poll for the next job. */
  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      const job = await this.connection.pop(this.queueName);

      if (job) {
        await this.processJob(job);
        // Immediately poll again (there might be more jobs)
        if (this.running) this.poll();
        return;
      }
    } catch {
      // Pop failed — wait before retrying
    }

    // No job found or error — wait before next poll
    this.pollTimer = setTimeout(() => this.poll(), this.options.pollIntervalMs);
  }

  /** Process a single job with timeout and retry. */
  private async processJob(job: IQueuedJob): Promise<void> {
    try {
      await this.executeWithTimeout(job);
      this.processedCount++;
    } catch (error: Error | any) {
      // Job failed — check if retries remain
      const attemptsUsed = job.attempts + 1;
      if (attemptsUsed < this.options.tries) {
        // Re-push with backoff delay
        const delay = this.computeBackoff(attemptsUsed);
        await this.connection.push(job.name, job.data, {
          queue: this.queueName,
          delayMs: delay,
          tries: job.maxAttempts,
        });
      }
      // else: max attempts exceeded — job is dead (dropped)
    }
  }

  /** Execute a job with timeout. */
  private async executeWithTimeout(job: IQueuedJob): Promise<void> {
    if (this.options.timeoutMs <= 0 || this.options.timeoutMs === Infinity) {
      await this.handler(job);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Job ${job.id} exceeded timeout of ${this.options.timeoutMs}ms`));
      }, this.options.timeoutMs);

      this.handler(job).then(
        () => {
          clearTimeout(timer);
          resolve();
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }

  /** Compute exponential backoff delay. */
  private computeBackoff(attempt: number): number {
    const delay = this.options.backoffMs * Math.pow(2, attempt - 1);
    return Math.min(delay, this.options.maxBackoffMs);
  }
}
