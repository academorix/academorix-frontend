/**
 * @file realtime.error.ts
 * @module @stackra/realtime/core/errors
 * @description Base error for the realtime package.
 */
export class RealtimeError extends Error {
  public readonly code: string;
  public constructor(message: string, code: string = 'REALTIME_ERROR') {
    super(message);
    this.name = 'RealtimeError';
    this.code = code;
    Object.setPrototypeOf(this, RealtimeError.prototype);
  }
}
