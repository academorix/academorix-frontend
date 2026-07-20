/**
 * @file queue-handle.service.ts
 * @module @stackra/queue/core/services
 * @description Lightweight class bound to a specific (connection, queue) pair.
 *   Provides a scoped API for dispatching and managing jobs on one queue.
 */

import type { IQueueConnection, IJobOptions, IQueuedJob } from "@/core/interfaces";

/**
 * A queue handle bound to a specific connection and queue name.
 *
 * Returned by `QueueManager.queue('emails', 'redis')`. Provides
 * a scoped API without needing to pass the queue name on every call.
 *
 * @example
 * ```typescript
 * const emails = await manager.queue('emails');
 * await emails.push('welcome', { to: 'user@example.com' });
 * await emails.push('invoice', { orderId: '123' });
 * const size = await emails.size();
 * ```
 */
export class QueueHandle {
  /**
   * @param connection - The underlying queue connection
   * @param queueName - The queue tube this handle is bound to
   */
  public constructor(
    private readonly connection: IQueueConnection,
    private readonly queueName: string,
  ) {}

  /**
   * Push a job onto this queue.
   *
   * @param name - Job name (routes to the correct processor)
   * @param data - Job payload
   * @param options - Additional options (delay, tries)
   * @returns The assigned job ID
   */
  public async push<T = unknown>(
    name: string,
    data: T,
    options?: Omit<IJobOptions, "queue">,
  ): Promise<string> {
    return this.connection.push(name, data, { ...options, queue: this.queueName });
  }

  /**
   * Push a job with a delay.
   *
   * @param delayMs - Delay in milliseconds
   * @param name - Job name
   * @param data - Job payload
   * @param options - Additional options
   * @returns The assigned job ID
   */
  public async later<T = unknown>(
    delayMs: number,
    name: string,
    data: T,
    options?: Omit<IJobOptions, "queue">,
  ): Promise<string> {
    return this.connection.later(delayMs, name, data, { ...options, queue: this.queueName });
  }

  /**
   * Push multiple jobs at once.
   *
   * @param jobs - Array of job definitions
   * @returns Array of assigned job IDs
   */
  public async bulk<T = unknown>(
    jobs: Array<{ name: string; data: T; options?: Omit<IJobOptions, "queue"> }>,
  ): Promise<string[]> {
    return this.connection.bulk(
      jobs.map((j) => ({ ...j, options: { ...j.options, queue: this.queueName } })),
    );
  }

  /**
   * Pop the next available job from this queue.
   *
   * @returns The next job, or null if empty
   */
  public async pop(): Promise<IQueuedJob | null> {
    return this.connection.pop(this.queueName);
  }

  /**
   * Get the number of jobs in this queue.
   *
   * @returns Job count
   */
  public async size(): Promise<number> {
    return this.connection.size(this.queueName);
  }

  /**
   * Pause this queue.
   */
  public async pause(): Promise<void> {
    return this.connection.pause(this.queueName);
  }

  /**
   * Resume this queue.
   */
  public async resume(): Promise<void> {
    return this.connection.resume(this.queueName);
  }

  /**
   * Clear all jobs from this queue.
   */
  public async clear(): Promise<void> {
    return this.connection.clear(this.queueName);
  }

  /**
   * Get the queue name this handle is bound to.
   *
   * @returns Queue name string
   */
  public getName(): string {
    return this.queueName;
  }
}
