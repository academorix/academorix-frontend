/**
 * @file memory.connector.ts
 * @module @stackra/queue/core/connectors
 * @description In-memory queue connector — jobs stored in a Map.
 *   Jobs are processed in FIFO order. Data does not persist across restarts.
 *   Ideal for development, testing, and single-process applications.
 */

import { Injectable } from "@stackra/container";
import type {
  IQueueConnection,
  IQueueConnector,
  IJobOptions,
  IQueuedJob,
  IQueueConnectionConfig,
} from "@/core/interfaces";

// ════════════════════════════════════════════════════════════════════════════════
// Connection Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * In-memory queue connection. FIFO ordering, no persistence.
 */
export class MemoryConnection implements IQueueConnection {
  /** Jobs keyed by queue name → ordered array. */
  private readonly queues = new Map<string, IQueuedJob[]>();
  private idCounter = 0;

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const queueName = options?.queue ?? "default";
    const id = `mem_${++this.idCounter}`;
    const job: IQueuedJob<T> = {
      id,
      name,
      data,
      attempts: 0,
      maxAttempts: options?.tries ?? 1,
      queue: queueName,
      createdAt: Date.now(),
    };

    const queue = this.getQueue(queueName);
    queue.push(job);
    return id;
  }

  /** @inheritdoc */
  public async later<T>(
    delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    // Memory connector ignores delay (no timer) — job is immediately available
    return this.push(name, data, { ...options, delayMs });
  }

  /** @inheritdoc */
  public async bulk<T>(
    jobs: Array<{ name: string; data: T; options?: IJobOptions }>,
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const job of jobs) {
      ids.push(await this.push(job.name, job.data, job.options));
    }
    return ids;
  }

  /** @inheritdoc */
  public async pop(queue: string = "default"): Promise<IQueuedJob | null> {
    const q = this.queues.get(queue);
    if (!q || q.length === 0) return null;
    return q.shift() ?? null;
  }

  /** @inheritdoc */
  public async size(queue: string = "default"): Promise<number> {
    return this.queues.get(queue)?.length ?? 0;
  }

  /** @inheritdoc */
  public async remove(jobId: string): Promise<void> {
    for (const [, queue] of this.queues) {
      const index = queue.findIndex((j) => j.id === jobId);
      if (index !== -1) {
        queue.splice(index, 1);
        return;
      }
    }
  }

  /** @inheritdoc */
  public async pause(_queue?: string): Promise<void> {
    // No-op for memory (no background processing to pause)
  }

  /** @inheritdoc */
  public async resume(_queue?: string): Promise<void> {
    // No-op for memory
  }

  /** @inheritdoc */
  public async clear(queue: string = "default"): Promise<void> {
    this.queues.delete(queue);
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    this.queues.clear();
  }

  /** Get or create a queue array by name. */
  private getQueue(name: string): IQueuedJob[] {
    let queue = this.queues.get(name);
    if (!queue) {
      queue = [];
      this.queues.set(name, queue);
    }
    return queue;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Connector
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Memory connector — creates MemoryConnection instances.
 */
@Injectable()
export class MemoryConnector implements IQueueConnector {
  /**
   * Create a new in-memory connection.
   *
   * @param _config - Connection config (unused for memory)
   * @returns A MemoryConnection instance
   */
  public async connect(_config: IQueueConnectionConfig): Promise<IQueueConnection> {
    return new MemoryConnection();
  }
}
