/**
 * @file ai-tool-call.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Rendered state of a single tool call.
 */

import type { AiToolState } from "@/enums/ai-tool-state.enum";

/**
 * A tool call and its render state.
 *
 * `state` mirrors HeroUI Pro `ChatTool`'s `state` union. `origin` classifies
 * the call as server- or client-executed.
 */
export interface IAiToolCall {
  /** Identifier of the originating tool call. */
  toolCallId: string;
  /** Name of the invoked tool. */
  toolName: string;
  /** Assembled arguments (from `tool-call-delta` fragments). */
  args?: unknown;
  /** Partial JSON arguments while streaming. */
  argsText?: string;
  /** Current render state. */
  state: AiToolState;
  /** Successful result payload, when available. */
  result?: unknown;
  /** Error message, when the call failed. */
  error?: string;
  /** Whether the tool executes on the server or the client. */
  origin: "server" | "client";
  /** Whether the call requires user approval (backend flag OR client definition). */
  requiresApproval: boolean;
}
