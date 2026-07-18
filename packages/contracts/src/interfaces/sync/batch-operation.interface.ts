/**
 * @file batch-operation.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description A single operation in a batch push payload.
 */

import type { OperationType } from "@/enums/operation-type.enum";

/**
 * A single operation as it appears in a batch push request body.
 *
 * Slimmer than {@link import('./queued-operation.interface').IQueuedOperation} — it
 * drops the client-side bookkeeping (retryCount, status) that the server
 * does not need.
 */
export interface IBatchOperation {
  /** Kind of change. */
  type: OperationType;

  /** Collection / table the change targets. */
  collection: string;

  /** Operation payload. */
  data?: unknown;

  /** Document id (required for update / delete). */
  id?: string;
}
