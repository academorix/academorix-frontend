/**
 * @file recording-emitter.ts
 * @module @stackra/scheduler/__tests__/support
 * @description Minimal `IEventEmitter` used to assert on scheduler
 *   lifecycle event emission.
 */

import type { IEventEmitter } from '@stackra/contracts';

/** One recorded emit. */
export interface IRecordedEmit {
  event: string;
  payload: unknown;
}

/** Recording emitter — pushes every `.emit()` onto `.emitted`. */
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
