/**
 * @file ai-stream-event.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Typed, discriminated-union representation of a decoded AI
 *   stream event.
 */

import type { AiStreamEventType } from "@/enums/ai-stream-event-type.enum";

/**
 * A decoded AI stream event.
 *
 * A discriminated union keyed by {@link AiStreamEventType} — the single typed
 * currency flowing from the {@link IAiStreamDecoder} up through hooks and
 * components. UI code never reads raw transport frames.
 */
export type IAiStreamEvent =
  | { type: AiStreamEventType.TextStart; id: string }
  | { type: AiStreamEventType.TextDelta; id: string; delta: string }
  | { type: AiStreamEventType.TextEnd; id: string }
  | { type: AiStreamEventType.ToolCallStart; toolCallId: string; toolName: string }
  | { type: AiStreamEventType.ToolCallDelta; toolCallId: string; argsTextDelta: string }
  | { type: AiStreamEventType.ToolCallEnd; toolCallId: string; args: unknown }
  | { type: AiStreamEventType.ToolResult; toolCallId: string; result: unknown; isError: boolean }
  | { type: AiStreamEventType.Finish; runId: string; reason: string }
  | { type: AiStreamEventType.Error; message: string; recoverable: boolean };
