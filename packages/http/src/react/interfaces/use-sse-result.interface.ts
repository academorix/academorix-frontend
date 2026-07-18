/**
 * @file use-sse-result.interface.ts
 * @module @stackra/http/src/interfaces
 * @description IUseSseResult interface.
 */

import type { ISseEvent } from '@stackra/contracts';

/**
 * Result of {@link useSse}.
 *
 * @typeParam T - Decoded payload type for each event.
 */
export interface IUseSseResult<T> {
  /** Events received so far. */
  events: ISseEvent<T>[];
  /** Most recent event. */
  latest: ISseEvent<T> | undefined;
  /** Whether the SSE stream is still open. */
  open: boolean;
  /** Error from the stream, if any. */
  error: Error | null;
  /** Manually cancel the SSE stream. */
  cancel: () => void;
}
