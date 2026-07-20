/**
 * @file ai-stream-event-type.enum.ts
 * @module @stackra/contracts/enums
 * @description Discriminator for the typed AI stream-event union.
 */

/** Type discriminator for a decoded AI stream event. */
export enum AiStreamEventType {
  /** Assistant text block began. */
  TextStart = "text-start",
  /** Incremental assistant text delta. */
  TextDelta = "text-delta",
  /** Assistant text block ended. */
  TextEnd = "text-end",
  /** A tool call began streaming input. */
  ToolCallStart = "tool-call-start",
  /** Incremental tool-call argument delta. */
  ToolCallDelta = "tool-call-delta",
  /** A tool call's input finished streaming. */
  ToolCallEnd = "tool-call-end",
  /** A tool produced a result. */
  ToolResult = "tool-result",
  /** The run finished. */
  Finish = "finish",
  /** An error occurred. */
  Error = "error",
}
