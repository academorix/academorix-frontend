/**
 * @file ai-transport.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Single injectable transport interface behind which the active
 *   connection technology (SSE, NDJSON, WebSocket) is bound.
 */

import type { AiConnectionState } from "@/enums/ai-connection-state.enum";
import type { IAiChatRequest, IAiRequestSpec } from "./ai-request.interface";

/**
 * The pluggable connection layer carrying chat and context traffic.
 *
 * Swapping SSE for WebSocket changes only the bound implementation — hooks
 * and components consume decoded events and never touch this directly.
 */
export interface IAiTransport {
  /** Open a streaming chat request; yields raw protocol frames as strings. */
  stream(req: IAiChatRequest, signal: AbortSignal): AsyncIterable<string>;
  /** One-shot request/response for non-streaming endpoints. */
  request<T>(spec: IAiRequestSpec): Promise<T>;
  /** Observable connection state. */
  readonly state: AiConnectionState;
  /** Subscribe to connection-state changes; returns an unsubscribe function. */
  onStateChange(listener: (state: AiConnectionState) => void): () => void;
}
