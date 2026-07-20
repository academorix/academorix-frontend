/**
 * @file undoable-queue.interface.ts
 * @module @stackra/contracts/interfaces/query
 * @description Contract for the queue that tracks in-flight
 *   `mutationMode: 'undoable'` mutations.
 *
 *   `useMutation` calls `queue.add(entry)` when a caller triggers an
 *   undoable write and enqueues the actual server call behind a
 *   countdown. A toast subscribes to the queue via `queue.subscribe`
 *   and renders one row per entry with an "Undo" button. The toast
 *   button calls `queue.cancel(id)`; the timeout expiry (or explicit
 *   `queue.commit(id)`) fires the mutation.
 */

/**
 * Kind of resolution applied to a queued undoable mutation.
 */
export type UndoableResolution = "commit" | "cancel";

/**
 * A single entry in the undoable queue.
 */
export interface IUndoableMutation {
  /** Unique id — used by the toast UI as a React key + cancel handle. */
  readonly id: string;

  /**
   * Optional human-readable label the toast surfaces (e.g. "Applied
   * theme 'Netflix Dark' — undo?").
   */
  readonly label?: string;

  /**
   * Optional resource hint used by consumer analytics / grouping.
   * Not interpreted by the queue itself.
   */
  readonly resource?: string;

  /** Timestamp when the entry was queued. */
  readonly createdAt: Date;

  /** Number of milliseconds the queue waits before committing. */
  readonly timeoutMs: number;
}

/** Callback fired when the queue's contents change. */
export type UndoableQueueListener = (mutations: readonly IUndoableMutation[]) => void;

/** Unsubscribe handle returned by `IUndoableQueue.subscribe`. */
export type UndoableQueueUnsubscribe = () => void;

/**
 * The queue surface consumed by `useMutation` (for enqueuing) and
 * by the toast UI (for cancel + subscribe).
 */
export interface IUndoableQueue {
  /**
   * Enqueue a mutation. Returns a `Promise` that resolves with
   * `'commit'` when the timeout elapses (or `commit` is called
   * explicitly) and `'cancel'` when the user cancels.
   */
  add(entry: IUndoableMutation): Promise<UndoableResolution>;

  /** Cancel a queued mutation by id. No-op when the id is unknown. */
  cancel(id: string): void;

  /**
   * Commit a queued mutation immediately (bypass the remaining
   * countdown). No-op when the id is unknown.
   */
  commit(id: string): void;

  /** Snapshot of currently-pending entries. */
  getPending(): readonly IUndoableMutation[];

  /**
   * Subscribe to queue changes. The listener fires on every
   * `add` / `cancel` / `commit` with the fresh pending list.
   */
  subscribe(listener: UndoableQueueListener): UndoableQueueUnsubscribe;
}
