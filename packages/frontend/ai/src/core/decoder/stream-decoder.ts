/**
 * @file stream-decoder.ts
 * @module @stackra/ai/core/decoder
 * @description The single wire-format-aware component in `@stackra/ai`.
 *
 *   Maps raw protocol frames from the backend into typed
 *   {@link IAiStreamEvent}s. Consumers (`ChatOrchestrator`, hooks,
 *   components) work only with the decoded discriminated union — they
 *   never touch a raw frame.
 *
 *   Frames arriving on the transport are JSON objects keyed by `type`:
 *
 *   ```json
 *   {"type":"text-delta","id":"msg-1","delta":"Hello"}
 *   {"type":"tool-call-start","toolCallId":"c1","toolName":"navigate"}
 *   {"type":"finish","runId":"r1","reason":"stop"}
 *   ```
 *
 *   The bare `[DONE]` sentinel terminates the stream — the decoder
 *   returns `null` so the caller can stop iterating without emitting a
 *   data event.
 */

import { Injectable } from '@stackra/container';
import { AiStreamEventType, type IAiStreamDecoder, type IAiStreamEvent } from '@stackra/contracts';

/** The sentinel signalling the stream has completed. */
const DONE_SENTINEL = '[DONE]';

/**
 * Pure function-style decoder — no state, no side effects.
 *
 * `decode(frame)` maps a single wire frame to a typed event or `null`
 * (for `[DONE]`), or an `Error` event when the frame is not valid JSON.
 * It never throws — Requirement 4.6, and Property 2 (totality).
 */
@Injectable()
export class StreamDecoder implements IAiStreamDecoder {
  /**
   * Decode one wire frame into a typed AI stream event.
   *
   * @param frame - Raw protocol frame (the `data:` field of an SSE event
   *   or the payload of an NDJSON line, already stripped of any framing).
   * @returns The typed event, or `null` on the `[DONE]` sentinel.
   */
  public decode(frame: string): IAiStreamEvent | null {
    // 1. `[DONE]` terminates the stream (Req 4.5).
    if (frame === DONE_SENTINEL || frame.trim() === DONE_SENTINEL) {
      return null;
    }

    // 2. Parse JSON. Invalid JSON becomes an Error event, never a throw
    //    (Req 4.6 + Property 2 totality).
    let parsed: unknown;
    try {
      parsed = JSON.parse(frame);
    } catch (err) {
      return {
        type: AiStreamEventType.Error,
        message: `Invalid protocol frame: ${err instanceof Error ? err.message : String(err)}`,
        recoverable: true,
      };
    }

    // 3. Only object frames are protocol events; primitives / arrays surface
    //    as recoverable errors.
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return this.makeErrorEvent('Protocol frame must be a JSON object');
    }

    const record = parsed as Record<string, unknown>;
    const rawType = record.type;
    if (typeof rawType !== 'string') {
      return this.makeErrorEvent('Protocol frame missing string `type` field');
    }

    // 4. Map by discriminator. Unknown types surface as recoverable errors
    //    so a forward-compatible backend addition never crashes the client.
    switch (rawType) {
      case AiStreamEventType.TextStart:
        return this.decodeTextStart(record);
      case AiStreamEventType.TextDelta:
        return this.decodeTextDelta(record);
      case AiStreamEventType.TextEnd:
        return this.decodeTextEnd(record);
      case AiStreamEventType.ToolCallStart:
        return this.decodeToolCallStart(record);
      case AiStreamEventType.ToolCallDelta:
        return this.decodeToolCallDelta(record);
      case AiStreamEventType.ToolCallEnd:
        return this.decodeToolCallEnd(record);
      case AiStreamEventType.ToolResult:
        return this.decodeToolResult(record);
      case AiStreamEventType.Finish:
        return this.decodeFinish(record);
      case AiStreamEventType.Error:
        return this.decodeError(record);
      default:
        return this.makeErrorEvent(`Unknown protocol frame type "${rawType}"`);
    }
  }

  // ────────────────────────────────────────────────────────────────────
  // Per-type decoders
  // ────────────────────────────────────────────────────────────────────

  private decodeTextStart(r: Record<string, unknown>): IAiStreamEvent {
    return { type: AiStreamEventType.TextStart, id: this.str(r.id) };
  }

  private decodeTextDelta(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.TextDelta,
      id: this.str(r.id),
      delta: this.str(r.delta),
    };
  }

  private decodeTextEnd(r: Record<string, unknown>): IAiStreamEvent {
    return { type: AiStreamEventType.TextEnd, id: this.str(r.id) };
  }

  private decodeToolCallStart(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.ToolCallStart,
      toolCallId: this.str(r.toolCallId),
      toolName: this.str(r.toolName),
    };
  }

  private decodeToolCallDelta(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.ToolCallDelta,
      toolCallId: this.str(r.toolCallId),
      argsTextDelta: this.str(r.argsTextDelta),
    };
  }

  private decodeToolCallEnd(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.ToolCallEnd,
      toolCallId: this.str(r.toolCallId),
      args: r.args,
    };
  }

  private decodeToolResult(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.ToolResult,
      toolCallId: this.str(r.toolCallId),
      result: r.result,
      isError: Boolean(r.isError),
    };
  }

  private decodeFinish(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.Finish,
      runId: this.str(r.runId),
      reason: this.str(r.reason),
    };
  }

  private decodeError(r: Record<string, unknown>): IAiStreamEvent {
    return {
      type: AiStreamEventType.Error,
      message: this.str(r.message),
      // Default to `true` — a backend error the decoder decodes is
      // definitionally recoverable at the protocol level.
      recoverable: r.recoverable === undefined ? true : Boolean(r.recoverable),
    };
  }

  // ────────────────────────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────────────────────────

  /** Coerce an arbitrary value to a string field (missing fields become empty). */
  private str(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private makeErrorEvent(message: string): IAiStreamEvent {
    return { type: AiStreamEventType.Error, message, recoverable: true };
  }
}
