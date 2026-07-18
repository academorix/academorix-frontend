/**
 * @file sync.connector.ts
 * @module @stackra/queue/core/connectors
 * @description Synchronous queue connector — jobs execute immediately inline.
 *   No background processing. The `push()` method executes the job
 *   synchronously (if a processor is registered) or stores it for later pop.
 *   Primarily for testing where you want deterministic, immediate execution.
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
 * Sync connection — stores jobs for manual pop() consumption.
 */
export class SyncConnection implements IQueueConnection {
  private readonly queues = new Map<string, IQueuedJob[]>();
  private idCounter = 0;

  /** @inheritdoc */
  public async push<T>(name: string, data: T, options?: IJobOptions): Promise<string> {
    const queueName = options?.queue ?? "default";
    const id = `sync_${++this.idCounter}`;
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
    _delayMs: number,
    name: string,
    data: T,
    options?: IJobOptions,
  ): Promise<string> {
    return this.push(name, data, options);
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
  public async pause(): Promise<void> {
    /* no-op */
  }
  /** @inheritdoc */
  public async resume(): Promise<void> {
    /* no-op */
  }

  /** @inheritdoc */
  public async clear(queue: string = "default"): Promise<void> {
    this.queues.delete(queue);
  }

  /** @inheritdoc */
  public async close(): Promise<void> {
    this.queues.clear();
  }

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

/** Sync connector — creates SyncConnection instances for testing. */
@Injectable()
export class SyncConnector implements IQueueConnector {
  public async connect(_config: IQueueConnectionConfig): Promise<IQueueConnection> {
    return new SyncConnection();
  }
}
