/**
 * @file ai-schema.error.ts
 * @module @stackra/ai/core/errors
 * @description Schema validation / conversion failure. Emitted by the
 *   `ToolConverter` on invalid parameter schemas (Req 7.7) and by the
 *   `ToolExecutor` when decoded tool-call arguments fail validation
 *   against the client-tool's declared schema (Req 6.13).
 */

import { AiError } from "./ai.error";

/**
 * Thrown when a zod (or JSON) schema is invalid, or when a set of
 * arguments fails to validate against it.
 *
 * Carries the offending `toolName` so diagnostics identify the culprit
 * without further lookup.
 */
export class AiSchemaError extends AiError {
  /**
   * @param message - Human-readable error description.
   * @param toolName - Name of the tool whose schema/arguments failed.
   * @param cause - The originating validation error.
   */
  public constructor(
    message: string,
    public readonly toolName: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
