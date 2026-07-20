/**
 * @file realtime-connection.error.ts
 * @module @stackra/realtime/core/errors
 * @description Error thrown when a realtime connection fails.
 */
import { RealtimeError } from './realtime.error';

export class RealtimeConnectionError extends RealtimeError {
  public constructor(message: string) {
    super(message, 'REALTIME_CONNECTION_ERROR');
    this.name = 'RealtimeConnectionError';
    Object.setPrototypeOf(this, RealtimeConnectionError.prototype);
  }
}
