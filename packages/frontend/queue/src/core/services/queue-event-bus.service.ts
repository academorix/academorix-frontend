/**
 * @file queue-event-bus.service.ts
 * @module @stackra/queue/core/services
 * @description Emits queue lifecycle events through the optional @stackra/events EventEmitter.
 *   Provides observability for job dispatching, processing, completion, failure, and dead-lettering.
 */

import { Injectable, Inject, Optional } from "@stackra/container";
import { QUEUE_EVENTS } from "@stackra/contracts";
import { EVENT_EMITTER } from "@stackra/contracts";
import type { IEventEmitter } from "@stackra/contracts";

// ════════════════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════════════════

/** Minimal event emitter interface. */

/** DI token for the optional event emitter. */
// ════════════════════════════════════════════════════════════════════════════════
// Implementation
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Queue lifecycle event bus.
 *
 * Emits events via the optional `@stackra/events` EventEmitter for
 * observability, logging, and metrics. Fail-open pattern — if events
 * package is not in the DI graph, operations continue silently.
 */
@Injectable()
export class QueueEventBus {
  public constructor(@Optional() @Inject(EVENT_EMITTER) private readonly emitter?: IEventEmitter) {}

  /** Emit when a job is dispatched to a queue. */
  public jobDispatched(jobId: string, queue: string, name: string): void {
    this.emit(QUEUE_EVENTS.JOB_DISPATCHED, { jobId, queue, name, at: Date.now() });
  }

  /** Emit when a job starts processing. */
  public jobStarted(jobId: string, queue: string, name: string): void {
    this.emit(QUEUE_EVENTS.JOB_STARTED, { jobId, queue, name, at: Date.now() });
  }

  /** Emit when a job completes successfully. */
  public jobCompleted(jobId: string, queue: string, name: string, durationMs: number): void {
    this.emit(QUEUE_EVENTS.JOB_COMPLETED, { jobId, queue, name, durationMs, at: Date.now() });
  }

  /** Emit when a job fails (may retry). */
  public jobFailed(
    jobId: string,
    queue: string,
    name: string,
    error: string,
    attempt: number,
  ): void {
    this.emit(QUEUE_EVENTS.JOB_FAILED, { jobId, queue, name, error, attempt, at: Date.now() });
  }

  /** Emit when a job exceeds max attempts and is dead. */
  public jobDead(jobId: string, queue: string, name: string): void {
    this.emit(QUEUE_EVENTS.JOB_DEAD, { jobId, queue, name, at: Date.now() });
  }

  /** Internal emit — swallows errors. */
  private emit(event: string, payload: Record<string, unknown>): void {
    if (!this.emitter) return;
    try {
      void this.emitter.emit(event, payload);
    } catch {
      /* fail-open */
    }
  }
}
