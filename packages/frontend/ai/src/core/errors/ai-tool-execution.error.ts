/**
 * @file ai-tool-execution.error.ts
 * @module @stackra/ai/core/errors
 * @description Wraps a failure inside a client-tool handler so consumers
 *   can distinguish tool failures from transport or schema failures.
 */

import { AiError } from "./ai.error";

/**
 * Thrown by the `ToolExecutor` when a client-tool handler throws.
 *
 * The `toolCallId` and `toolName` are preserved for correlating the
 * failure back to the originating tool call in the UI and in logs.
 */
export class AiToolExecutionError extends AiError {
  /**
   * @param message - Human-readable error description.
   * @param toolCallId - Identifier of the originating tool call.
   * @param toolName - Name of the invoked tool.
   * @param cause - The error thrown by the handler.
   */
  public constructor(
    message: string,
    public readonly toolCallId: string,
    public readonly toolName: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
