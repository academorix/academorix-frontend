/**
 * @file ai-stream-decoder.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Contract for the wire-format-aware stream decoder.
 */

import type { IAiStreamEvent } from "./ai-stream-event.interface";

/**
 * Maps raw data-protocol frames into typed {@link IAiStreamEvent}s.
 *
 * The single wire-format-aware component. Returns `null` on the `[DONE]`
 * sentinel and emits an error event on invalid JSON while continuing.
 */
export interface IAiStreamDecoder {
  /** Decode a single protocol frame into a typed event, or `null` to terminate. */
  decode(frame: string): IAiStreamEvent | null;
}
