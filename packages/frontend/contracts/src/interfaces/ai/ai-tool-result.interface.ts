/**
 * @file ai-tool-result.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Result posted back against an originating tool call.
 */

/** The result (or rejection/error) of a tool call. */
export interface IAiToolResult {
  /** Identifier of the originating tool call. */
  toolCallId: string;
  /** Successful result payload, when available. */
  result?: unknown;
  /** Error message, when the handler failed. */
  error?: string;
  /** Whether the user rejected an approval-required call. */
  rejected?: boolean;
}
