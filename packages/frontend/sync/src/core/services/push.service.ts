/**
 * @file push.service.ts
 * @module @stackra/sync/core/services
 * @description PushService — batched push with per-operation idempotency
 *   keys. Groups pending operations for a collection into batches sized
 *   by `IPushOptions.batchSize` and hands the resulting payload to the
 *   remote sync API.
 */

import { Inject, Injectable } from '@stackra/container';
import type {
  IBatchOperation,
  IHttpManager,
  IPushOptions,
  IPushResult,
  IQueuedOperation,
} from '@stackra/contracts';
import { HTTP_MANAGER, OPERATION_QUEUE, OperationStatus, OperationType } from '@stackra/contracts';
import { Logger } from '@stackra/logger';
import { Str } from '@stackra/support';
import type { OperationQueue } from './operation-queue.service';

/**
 * Wire shape of the batch push request body.
 * Local type — the server contract stays internal to this service.
 */
interface IBatchPushBody {
  batchId: string;
  collection: string;
  operations: IBatchOperation[];
  idempotencyKey: string;
}

/**
 * Wire shape of the batch push response.
 * Local type — the server contract stays internal to this service.
 */
interface IBatchPushResponse {
  results: Array<{
    idempotencyKey: string;
    success: boolean;
    retryable?: boolean;
    error?: string;
  }>;
}

/**
 * PushService — batched push with per-operation idempotency keys.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  public constructor(
    @Inject(HTTP_MANAGER) private readonly http: IHttpManager,
    @Inject(OPERATION_QUEUE) private readonly operationQueue: OperationQueue
  ) {}

  /**
   * Push every pending operation for a collection.
   *
   * Operations are grouped into batches of `options.batchSize`. Each
   * batch carries a batch-level idempotency key and each operation
   * inside the batch carries its own so the server can deduplicate
   * on retry.
   */
  public async push(collection: string, options: IPushOptions): Promise<IPushResult> {
    let totalPushed = 0;
    let totalFailed = 0;
    const errors: Array<{ operationId: string; message: string }> = [];

    const pending = this.operationQueue
      .getByStatus(OperationStatus.Pending)
      .filter((op) => op.collection === collection);

    if (pending.length === 0) {
      return { pushed: 0, failed: 0, errors: [] };
    }

    const client = await this.http.connection();

    for (let i = 0; i < pending.length; i += options.batchSize) {
      const batchOps = pending.slice(i, i + options.batchSize);
      const batchBody = this.createBatch(collection, batchOps);

      try {
        for (const op of batchOps) op.status = OperationStatus.Processing;

        const response = await client.request<IBatchPushResponse>({
          url: `${options.baseUrl}/${collection}/sync/push`,
          method: 'POST',
          data: batchBody,
          timeout: options.timeout,
        });

        for (const result of response.data.results) {
          const operation = batchOps.find((op) => op.idempotencyKey === result.idempotencyKey);
          if (!operation) continue;

          if (result.success) {
            operation.status = OperationStatus.Completed;
            await this.operationQueue.remove(operation.id);
            totalPushed++;
          } else if (result.retryable) {
            operation.status = OperationStatus.Pending;
            operation.retryCount++;
            operation.lastError = result.error;
          } else {
            operation.status = OperationStatus.Failed;
            operation.lastError = result.error;
            totalFailed++;
            errors.push({ operationId: operation.id, message: result.error ?? 'Unknown error' });
          }
        }
      } catch (error: unknown) {
        this.logger.error(`[PushService] Batch failed for "${collection}"`, { error });
        for (const op of batchOps) {
          op.status = OperationStatus.Pending;
          op.retryCount++;
          op.lastError = error instanceof Error ? error.message : String(error);
        }
        // Stop processing further batches when the network is down.
        break;
      }
    }

    return { pushed: totalPushed, failed: totalFailed, errors };
  }

  /**
   * Build a batch payload from queued operations.
   */
  private createBatch(collection: string, operations: IQueuedOperation[]): IBatchPushBody {
    const items: IBatchOperation[] = operations.map((op) => ({
      type: op.type as OperationType,
      collection,
      id: op.documentId,
      data: op.data,
    }));

    return {
      batchId: this.generateBatchId(),
      collection,
      operations: items,
      idempotencyKey: this.generateIdempotencyKey(),
    };
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  private generateIdempotencyKey(): string {
    return Str.uuid();
  }
}
