/**
 * @file push-result.interface.ts
 * @module @stackra/contracts/interfaces/sync
 * @description Result of a push operation for a single collection.
 */

/**
 * Result of a single-collection push.
 */
export interface IPushResult {
  /** Total operations successfully pushed to remote. */
  pushed: number;

  /** Total operations that failed permanently during the push. */
  failed: number;

  /** Failed operations with their error messages. */
  errors: Array<{ operationId: string; message: string }>;
}
