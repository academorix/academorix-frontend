/**
 * @file call-record.interface.ts
 * @module @stackra/testing/core
 * @description A single recorded call on an assertable mock — method name,
 *   arguments, and return value.
 */

/**
 * A recorded method call on an assertable proxy.
 *
 * @typeParam TArgs - Argument tuple type
 * @typeParam TReturn - Return type
 */
export interface ICallRecord<TArgs extends readonly unknown[] = unknown[], TReturn = unknown> {
  /** Method name invoked. */
  readonly method: string;
  /** Arguments passed to the call. */
  readonly args: TArgs;
  /** Value returned by the method (or `undefined` if the call threw). */
  readonly returnValue?: TReturn;
  /** Error thrown by the method (if any). */
  readonly error?: unknown;
  /** Monotonic sequence number in the order calls were made. */
  readonly sequence: number;
  /** Wall-clock timestamp of the call (ms since epoch). */
  readonly timestamp: number;
}
