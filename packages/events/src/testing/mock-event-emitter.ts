/**
 * @file mock-event-emitter.ts
 * @module @stackra/events/testing
 * @description In-memory `IEventEmitter` implementation for tests.
 *
 *   Records every emitted event on `.emittedEvents` and dispatches to
 *   any subscribed listeners, so consumer code that awaits `emit()` and
 *   handlers wired via `on()` both work end-to-end.
 */

import type { IEventEmitter } from "@stackra/contracts";

/** Recorded emission entry — event name + payload. */
export interface RecordedEmit<T = unknown> {
  event: string;
  payload: T;
  emittedAt: number;
}

type Listener = (payload: unknown) => void | Promise<void>;

/**
 * In-memory event emitter for testing.
 *
 * Fully implements the `IEventEmitter` contract:
 * - `emit()` awaits every listener sequentially and records the emission.
 * - `on()` returns an unsubscribe function.
 * - `eventNames()` / `listenerCount()` / `removeAllListeners()` reflect
 *   the current subscription state.
 */
export class MockEventEmitter implements IEventEmitter {
  /** Every event ever emitted, in chronological order. */
  public readonly emittedEvents: RecordedEmit[] = [];

  /** Registered listeners keyed by event name. */
  private readonly listeners = new Map<string | symbol, Set<Listener>>();

  public async emit(event: string, payload?: unknown): Promise<void> {
    this.emittedEvents.push({ event, payload, emittedAt: Date.now() });
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      await listener(payload);
    }
  }

  public on(event: string, listener: Listener): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(event, bucket);
    }
    bucket.add(listener);
    return () => {
      bucket!.delete(listener);
      if (bucket!.size === 0) this.listeners.delete(event);
    };
  }

  public eventNames(): Array<string | symbol> {
    return Array.from(this.listeners.keys());
  }

  public listenerCount(event: string | symbol): number {
    return this.listeners.get(event)?.size ?? 0;
  }

  public removeAllListeners(event?: string | symbol): void {
    if (event === undefined) {
      this.listeners.clear();
      return;
    }
    this.listeners.delete(event);
  }

  /** Return every emit for a specific event — handy for assertions. */
  public getEmitsFor(event: string): RecordedEmit[] {
    return this.emittedEvents.filter((e) => e.event === event);
  }

  /** Drop the emitted-events ledger without touching subscriptions. */
  public clearEmitted(): void {
    this.emittedEvents.length = 0;
  }
}
