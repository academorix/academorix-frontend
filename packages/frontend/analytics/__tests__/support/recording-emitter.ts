/**
 * @file recording-emitter.ts
 * @module @stackra/analytics/__tests__/support
 * @description Minimal `IEventEmitter` that records every `.emit()` call.
 *
 *   Used only to assert on the wiring around the analytics manager;
 *   the manager itself does not emit today, so the recorder mostly
 *   proves that no ambient event traffic escapes when the emitter is
 *   optional.
 */

import type { IEventEmitter } from "@stackra/contracts";

/** One emitted call recorded by the {@link RecordingEmitter}. */
export interface IRecordedEmit {
  /** The event name. */
  event: string;
  /** The payload (may be undefined). */
  payload: unknown;
}

/**
 * A capturing event emitter — records every `emit` call so specs can
 * assert on wiring. The `on`/`off` surface is stubbed because the
 * production code never subscribes back.
 */
export class RecordingEmitter implements IEventEmitter {
  public readonly emitted: IRecordedEmit[] = [];

  public emit(event: string, payload?: unknown): boolean | Promise<boolean> {
    this.emitted.push({ event, payload });
    return true;
  }

  public on(): () => void {
    return () => {};
  }

  public eventNames(): string[] {
    return [];
  }

  public listenerCount(): number {
    return 0;
  }

  public removeAllListeners(): void {
    /* noop */
  }

  /** Reset the recorded stream — usually between describe blocks. */
  public reset(): void {
    this.emitted.length = 0;
  }
}
