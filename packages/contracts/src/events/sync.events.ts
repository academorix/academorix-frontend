/**
 * @file sync.events.ts
 * @module @stackra/contracts/events
 * @description Event names emitted by `@stackra/sync` on the `EVENT_EMITTER`
 *   bus.
 *
 *   Constants live in contracts so cross-package consumers (sdui, ai,
 *   dashboards) can subscribe without depending on the sync runtime.
 */

/**
 * Sync lifecycle event names.
 */
export const SYNC_EVENTS = {
  /** A sync operation began. Payload: `{ direction, collections }`. */
  STARTED: "sync.started",
  /** A sync operation completed successfully. Payload: `ISyncResult`. */
  COMPLETED: "sync.completed",
  /** A sync operation failed. Payload: `{ direction, error }`. */
  FAILED: "sync.failed",
  /** Sync progress update. Payload: `ISyncProgress`. */
  PROGRESS: "sync.progress",
  /** A conflict was detected during pull/merge. Payload: `IConflict`. */
  CONFLICT_DETECTED: "sync.conflict-detected",
  /** A conflict was resolved. Payload: `IConflictResolution`. */
  CONFLICT_RESOLVED: "sync.conflict-resolved",
  /** An offline operation was enqueued. Payload: `IQueuedOperation`. */
  OPERATION_QUEUED: "sync.operation-queued",
  /** An enqueued operation was processed. Payload: `IQueuedOperation`. */
  OPERATION_PROCESSED: "sync.operation-processed",
  /** An enqueued operation failed permanently. Payload: `{ operation, error }`. */
  OPERATION_FAILED: "sync.operation-failed",
  /** A sync checkpoint was persisted. Payload: `ISyncCheckpoint`. */
  CHECKPOINT_SAVED: "sync.checkpoint-saved",
} as const;

/** Union type of every emitted sync event name. */
export type SyncEventName = (typeof SYNC_EVENTS)[keyof typeof SYNC_EVENTS];
