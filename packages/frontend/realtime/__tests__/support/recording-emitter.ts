/**
 * @file recording-emitter.ts
 * @module @stackra/realtime/__tests__/support
 * @description Minimal `IEventEmitter` that captures every emit for
 *   assertion. The realtime manager only calls `emit()`; the
 *   subscribe surface is stubbed to keep the type happy.
 */

import type { IEventEmitter } from '@stackra/contracts';

/** One recorded emit call. */
export interface IRecordedEmit {
  event: string;
  payload: unknown;
}

/** Recording emitter — every `.emit()` lands on `.emitted`. */
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

  public reset(): void {
    this.emitted.length = 0;
  }
}
