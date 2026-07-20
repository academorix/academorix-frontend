/**
 * @file use-stream-result.interface.ts
 * @module @stackra/http/src/interfaces
 * @description IUseStreamResult interface.
 */

/**
 * Result of {@link useStream}.
 *
 * @typeParam T - Decoded value type.
 */
export interface IUseStreamResult<T> {
  /** Values received so far (in order). */
  values: T[];
  /** Most recent value, or `undefined` until the first emission. */
  latest: T | undefined;
  /** Whether the underlying stream is still open. */
  open: boolean;
  /** Error from the stream, if any. */
  error: Error | null;
  /** Manually cancel the stream. */
  cancel: () => void;
}
