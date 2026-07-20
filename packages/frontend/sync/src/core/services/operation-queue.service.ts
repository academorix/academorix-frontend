/**
 * @file operation-queue.service.ts
 * @module @stackra/sync/core/services
 * @description OperationQueue — persists offline-triggered operations to
 *   localStorage, orders them by timestamp, and hands them to a caller-
 *   supplied processor when the network comes back.
 */

import { Inject, Injectable, Optional } from '@stackra/container';
import { BehaviorSubject, type Observable } from 'rxjs';
import type { IOperationQueueConfig, IQueuedOperation, IQueueStats } from '@stackra/contracts';
import { OPERATION_QUEUE_CONFIG, OperationStatus } from '@stackra/contracts';
import { Logger } from '@stackra/logger';
import { Str } from '@stackra/support';

/**
 * OperationQueue — offline operation persistence and replay.
 */
@Injectable()
export class OperationQueue {
  private readonly logger = new Logger(OperationQueue.name);
  private readonly config: Required<IOperationQueueConfig>;
  private readonly operations = new Map<string, IQueuedOperation>();
  private readonly statsSubject: BehaviorSubject<IQueueStats>;

  /** Observable that emits aggregate stats whenever the queue changes. */
  public readonly stats$: Observable<IQueueStats>;

  public constructor(
    @Optional() @Inject(OPERATION_QUEUE_CONFIG) config: IOperationQueueConfig = {}
  ) {
    this.config = {
      storageKey: config.storageKey ?? 'sync_operation_queue',
      maxRetries: config.maxRetries ?? 3,
      initialRetryDelay: config.initialRetryDelay ?? 1000,
      maxRetryDelay: config.maxRetryDelay ?? 30_000,
      enablePersistence: config.enablePersistence ?? true,
    };

    this.statsSubject = new BehaviorSubject<IQueueStats>(this.calculateStats());
    this.stats$ = this.statsSubject.asObservable();

    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }
  }

  /** Enqueue an operation. Returns the generated operation id. */
  public async enqueue(
    operation: Omit<
      IQueuedOperation,
      'id' | 'timestamp' | 'retryCount' | 'status' | 'idempotencyKey'
    >
  ): Promise<string> {
    const id = this.generateId();
    const queuedOperation: IQueuedOperation = {
      ...operation,
      id,
      timestamp: new Date(),
      retryCount: 0,
      status: OperationStatus.Pending,
      idempotencyKey: this.generateIdempotencyKey(),
    };

    this.operations.set(id, queuedOperation);
    await this.persist();
    this.updateStats();

    return id;
  }

  /** Dequeue the oldest pending operation without removing it. */
  public dequeue(): IQueuedOperation | null {
    const pending = Array.from(this.operations.values())
      .filter((op) => op.status === OperationStatus.Pending)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return pending[0] ?? null;
  }

  /** Run every pending operation through the caller-supplied processor. */
  public async processQueue(
    processor: (operation: IQueuedOperation) => Promise<void>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    let operation = this.dequeue();
    while (operation) {
      try {
        operation.status = OperationStatus.Processing;
        this.updateStats();

        await processor(operation);

        operation.status = OperationStatus.Completed;
        success++;

        const completedId = operation.id;
        setTimeout(() => {
          this.operations.delete(completedId);
          void this.persist();
          this.updateStats();
        }, 5_000);
      } catch (error: unknown) {
        operation.retryCount++;
        operation.lastError = error instanceof Error ? error.message : String(error);

        if (operation.retryCount >= this.config.maxRetries) {
          operation.status = OperationStatus.Failed;
          failed++;
        } else {
          operation.status = OperationStatus.Pending;

          const delay = Math.min(
            this.config.initialRetryDelay * Math.pow(2, operation.retryCount - 1),
            this.config.maxRetryDelay
          );
          setTimeout(() => this.updateStats(), delay);
        }
      }

      await this.persist();
      this.updateStats();

      operation = this.dequeue();
    }

    return { success, failed };
  }

  /** Get every operation currently in the queue. */
  public getAll(): IQueuedOperation[] {
    return Array.from(this.operations.values());
  }

  /** Get operations by status. */
  public getByStatus(status: OperationStatus): IQueuedOperation[] {
    return Array.from(this.operations.values()).filter((op) => op.status === status);
  }

  /** Get a single operation by id. */
  public getById(id: string): IQueuedOperation | undefined {
    return this.operations.get(id);
  }

  /** Remove an operation by id. */
  public async remove(id: string): Promise<boolean> {
    const deleted = this.operations.delete(id);
    if (deleted) {
      await this.persist();
      this.updateStats();
    }
    return deleted;
  }

  /** Clear every operation. */
  public async clear(): Promise<void> {
    this.operations.clear();
    await this.persist();
    this.updateStats();
  }

  /** Clear only completed operations. */
  public async clearCompleted(): Promise<number> {
    const completed = this.getByStatus(OperationStatus.Completed);
    for (const op of completed) this.operations.delete(op.id);
    await this.persist();
    this.updateStats();
    return completed.length;
  }

  /** Clear only failed operations. */
  public async clearFailed(): Promise<number> {
    const failed = this.getByStatus(OperationStatus.Failed);
    for (const op of failed) this.operations.delete(op.id);
    await this.persist();
    this.updateStats();
    return failed.length;
  }

  /** Current aggregate stats. */
  public getStats(): IQueueStats {
    return this.calculateStats();
  }

  /** Total operations in the queue (any status). */
  public size(): number {
    return this.operations.size;
  }

  /** Whether the queue is empty. */
  public isEmpty(): boolean {
    return this.operations.size === 0;
  }

  /** Whether the queue holds any pending operations. */
  public hasPending(): boolean {
    return this.getByStatus(OperationStatus.Pending).length > 0;
  }

  /** Cleanup resources. */
  public destroy(): void {
    this.statsSubject.complete();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateIdempotencyKey(): string {
    return Str.uuid();
  }

  private calculateStats(): IQueueStats {
    const operations = Array.from(this.operations.values());
    return {
      total: operations.length,
      pending: operations.filter((op) => op.status === OperationStatus.Pending).length,
      processing: operations.filter((op) => op.status === OperationStatus.Processing).length,
      completed: operations.filter((op) => op.status === OperationStatus.Completed).length,
      failed: operations.filter((op) => op.status === OperationStatus.Failed).length,
    };
  }

  private updateStats(): void {
    this.statsSubject.next(this.calculateStats());
  }

  private async persist(): Promise<void> {
    if (!this.config.enablePersistence || typeof localStorage === 'undefined') return;
    try {
      const serialized = JSON.stringify(Array.from(this.operations.values()));
      localStorage.setItem(this.config.storageKey, serialized);
    } catch (error: unknown) {
      this.logger.error('[OperationQueue] Failed to persist queue', { error });
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const serialized = localStorage.getItem(this.config.storageKey);
      if (!serialized) return;
      const operations = JSON.parse(serialized) as IQueuedOperation[];
      for (const op of operations) {
        op.timestamp = new Date(op.timestamp);
        this.operations.set(op.id, op);
      }
      this.updateStats();
    } catch (error: unknown) {
      this.logger.error('[OperationQueue] Failed to load queue from storage', { error });
    }
  }
}
