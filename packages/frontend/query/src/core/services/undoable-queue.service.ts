/**
 * @file undoable-queue.service.ts
 * @module @stackra/query/core/services
 * @description Concrete `IUndoableQueue` — tracks in-flight
 *   `mutationMode: 'undoable'` mutations and coordinates their
 *   commit / cancel resolution.
 *
 *   `useMutation` calls `queue.add(entry)` when a caller triggers an
 *   undoable write. The queue starts a per-entry countdown; a toast
 *   UI subscribes via `queue.subscribe(listener)` and offers the
 *   user an "Undo" button that calls `queue.cancel(entry.id)`. When
 *   the countdown elapses (or `queue.commit(entry.id)` is invoked
 *   directly), the queue resolves the pending promise with
 *   `'commit'` and `useMutation` fires the actual server call.
 *
 *   All timers are cleared on `commit` / `cancel` so the queue
 *   never leaks intervals.
 */

import { Injectable, Optional, Inject } from "@stackra/container";
import { Logger } from "@stackra/logger";
import {
  EVENT_EMITTER,
  type IEventEmitter,
  type IUndoableMutation,
  type IUndoableQueue,
  type UndoableQueueListener,
  type UndoableQueueUnsubscribe,
  type UndoableResolution,
} from "@stackra/contracts";

// ══════════════════════════════════════════════════════════════════
// Event names
// ══════════════════════════════════════════════════════════════════

/** Emitted when a new undoable mutation is enqueued. */
const EVENT_ENQUEUED = "query.undoable.enqueued";
/** Emitted when a queued mutation is committed (countdown elapsed / commit()). */
const EVENT_COMMITTED = "query.undoable.committed";
/** Emitted when a queued mutation is cancelled by the user. */
const EVENT_CANCELLED = "query.undoable.cancelled";

// ══════════════════════════════════════════════════════════════════
// Internal entry state
// ══════════════════════════════════════════════════════════════════

/** Internal state per queued mutation. */
interface QueuedEntry {
  readonly mutation: IUndoableMutation;
  readonly resolve: (resolution: UndoableResolution) => void;
  readonly reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

// ══════════════════════════════════════════════════════════════════
// Service
// ══════════════════════════════════════════════════════════════════

/**
 * The single shared undoable-mutation queue.
 *
 * @example
 * ```typescript
 * const resolution = await undoableQueue.add({
 *   id: 'delete-user-42',
 *   label: 'User deleted — undo?',
 *   resource: 'users',
 *   createdAt: new Date(),
 *   timeoutMs: 5000,
 * });
 *
 * if (resolution === 'commit') {
 *   await api.deleteUser(42);
 * }
 * // else — resolution === 'cancel', nothing to do
 * ```
 */
@Injectable()
export class UndoableQueueService implements IUndoableQueue {
  /** Scoped logger for debug traces. */
  private readonly logger = new Logger(UndoableQueueService.name);

  /** id → internal state. */
  private readonly entries = new Map<string, QueuedEntry>();

  /** Subscribers registered via `subscribe`. */
  private readonly listeners = new Set<UndoableQueueListener>();

  /**
   * @param eventEmitter - Optional event bus for `query.undoable.*`
   *   lifecycle events; the queue is fully functional without it.
   */
  public constructor(
    @Optional() @Inject(EVENT_EMITTER) private readonly eventEmitter?: IEventEmitter,
  ) {}

  // ── IUndoableQueue ────────────────────────────────────────────────

  /** @inheritdoc */
  public add(entry: IUndoableMutation): Promise<UndoableResolution> {
    // Prevent silent double-adds — same id would leak the earlier
    // pending promise.
    if (this.entries.has(entry.id)) {
      const message = `UndoableQueue: entry "${entry.id}" is already pending`;
      this.logger.warn(message);
      return Promise.reject(new Error(message));
    }

    return new Promise<UndoableResolution>((resolve, reject) => {
      const state: QueuedEntry = {
        mutation: entry,
        resolve,
        reject,
        timer: null,
      };
      this.entries.set(entry.id, state);

      // Fire the countdown. `commit` resolves 'commit'; explicit
      // `commit()` and `cancel()` clear the timer before calling
      // resolve so we never double-resolve.
      state.timer = setTimeout(() => {
        this.finalize(entry.id, "commit");
      }, entry.timeoutMs);

      this.emit(EVENT_ENQUEUED, {
        id: entry.id,
        resource: entry.resource,
        timeoutMs: entry.timeoutMs,
      });

      this.notify();
    });
  }

  /** @inheritdoc */
  public cancel(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.finalize(id, "cancel");
  }

  /** @inheritdoc */
  public commit(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.finalize(id, "commit");
  }

  /** @inheritdoc */
  public getPending(): readonly IUndoableMutation[] {
    return Array.from(this.entries.values(), (state) => state.mutation);
  }

  /** @inheritdoc */
  public subscribe(listener: UndoableQueueListener): UndoableQueueUnsubscribe {
    this.listeners.add(listener);
    // Fire once with the current snapshot so the subscriber can
    // hydrate immediately (matches `useSyncExternalStore` etiquette).
    try {
      listener(this.getPending());
    } catch (error: unknown) {
      this.logger.warn("initial listener notify failed", { error });
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ── Internal ──────────────────────────────────────────────────────

  /**
   * Resolve a queued entry and clean up its timer + listeners.
   */
  private finalize(id: string, resolution: UndoableResolution): void {
    const state = this.entries.get(id);
    if (!state) return;

    if (state.timer !== null) {
      clearTimeout(state.timer);
      state.timer = null;
    }

    this.entries.delete(id);

    // Resolve the pending promise so `useMutation` can proceed.
    try {
      state.resolve(resolution);
    } catch (error: unknown) {
      // Fail-soft: a broken resolver must not stop the queue from
      // emitting its lifecycle events or notifying subscribers.
      this.logger.warn("resolver threw during finalize", {
        id,
        resolution,
        error,
      });
    }

    this.emit(resolution === "commit" ? EVENT_COMMITTED : EVENT_CANCELLED, {
      id,
      resource: state.mutation.resource,
    });

    this.notify();
  }

  /** Broadcast the current pending list to every listener. */
  private notify(): void {
    if (this.listeners.size === 0) return;
    const snapshot = this.getPending();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (error: unknown) {
        // fail-soft — one bad listener must not break the others.
        this.logger.warn("listener threw during notify", { error });
      }
    }
  }

  /** Emit a lifecycle event on the optional bus. */
  private emit(name: string, payload: Record<string, unknown>): void {
    if (!this.eventEmitter) return;
    try {
      void this.eventEmitter.emit(name, payload);
    } catch (error: unknown) {
      // fail-soft — event bus failures must not affect the queue.
      this.logger.warn("event emit failed", { name, error });
    }
  }
}
