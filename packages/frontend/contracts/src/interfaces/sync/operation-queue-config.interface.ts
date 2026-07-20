/**
 * @file operation-queue-config.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Configuration for the offline operation queue.
 */

/**
 * Configuration slice for the {@link OperationQueue} service.
 */
export interface IOperationQueueConfig {
  /** Storage key used when persisting the queue. Defaults to `'sync_operation_queue'`. */
  storageKey?: string;

  /** Maximum retry attempts per operation. Defaults to 3. */
  maxRetries?: number;

  /** Initial retry delay in milliseconds. Defaults to 1000. */
  initialRetryDelay?: number;

  /** Maximum retry delay in milliseconds (backoff ceiling). Defaults to 30000. */
  maxRetryDelay?: number;

  /** Whether to persist the queue to storage. Defaults to `true`. */
  enablePersistence?: boolean;
}
