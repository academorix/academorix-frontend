/**
 * @file ai-request.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Request shapes carried by the AI transport.
 */

import type { IAiClientToolDefinition } from "./ai-tool-definition.interface";

/**
 * A streaming chat request opened against the transport.
 *
 * Carries the current converted client-tool definitions so advertisement
 * piggybacks the chat request and always reflects the mounted UI.
 */
export interface IAiChatRequest {
  /** Target persona/agent slug. */
  persona: string;
  /** Thread the message belongs to, when resuming a conversation. */
  threadId?: string;
  /** The user message text. */
  message: string;
  /** Currently-advertised client-tool definitions. */
  tools?: IAiClientToolDefinition[];
  /** Active run id, for resume/idempotency. */
  runId?: string;
}

/** A one-shot (non-streaming) request specification. */
export interface IAiRequestSpec {
  /** HTTP-style method. */
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Request path relative to the configured base URL. */
  path: string;
  /** Optional request body. */
  body?: unknown;
  /** Optional additional headers. */
  headers?: Record<string, string>;
}
