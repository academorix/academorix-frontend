/**
 * @file queued-operation.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description A single operation waiting in the offline queue.
 */

import type { OperationType } from "@/enums/operation-type.enum";
import type { OperationStatus } from "@/enums/operation-status.enum";

/**
 * A single operation captured by the offline queue.
 *
 * Persisted verbatim to storage, so every field is JSON-serializable
 * (dates are represented as `Date` at runtime but survive `JSON.stringify`
 * as ISO 8601 strings — the queue's loader re-hydrates them).
 */
export interface IQueuedOperation {
  /** Unique operation id (client-generated). */
  id: string;

  /** Stable idempotency key sent to the server on retries. */
  idempotencyKey: string;

  /** Kind of change captured. */
  type: OperationType;

  /** Collection / table the change targets. */
  collection: string;

  /** Operation payload — the document data (create/update) or a hint (delete). */
  data: unknown;

  /** Document id (required for update / delete). */
  documentId?: string;

  /** Timestamp the operation was enqueued. */
  timestamp: Date;

  /** Number of processing attempts made so far. */
  retryCount: number;

  /** Last error message from the most recent failed attempt. */
  lastError?: string;

  /** Current lifecycle status. */
  status: OperationStatus;
}
