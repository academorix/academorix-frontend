/**
 * @file ai-client.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description The endpoint layer over the transport. Every call attaches
 *   credentials from the injected auth provider.
 */

import type { IAiStreamEvent } from "./ai-stream-event.interface";
import type { IAiChatRequest } from "./ai-request.interface";
import type { IAiClientToolDefinition } from "./ai-tool-definition.interface";
import type { IAiToolResult } from "./ai-tool-result.interface";
import type { IPersona } from "./ai-persona.interface";
import type { IUiContextSnapshot } from "./ui-context-snapshot.interface";

/** Thin endpoint layer over the AI transport. */
export interface IAiClient {
  /** Stream a chat turn for a persona (`POST /api/ai/chat/{persona}`). */
  chat(persona: string, req: IAiChatRequest, signal: AbortSignal): AsyncIterable<IAiStreamEvent>;
  /** Cancel an in-progress run (`DELETE /api/ai/runs/{run}`). */
  cancelRun(runId: string): Promise<void>;
  /** Post a tool result against its originating tool call. */
  postToolResult(result: IAiToolResult): Promise<void>;
  /** Confirm a pending draft (`POST /api/ai/drafts/{draft}/confirm`). */
  confirmDraft(draftId: string): Promise<void>;
  /** Retrieve available personas (`GET /api/admin/ai/personas`). */
  listPersonas(): Promise<IPersona[]>;
  /** Retrieve the backend tool catalog (`GET /api/admin/ai/tools`). */
  listTools(): Promise<IAiClientToolDefinition[]>;
  /** Advertise the current converted client-tool definitions. */
  advertiseTools(defs: IAiClientToolDefinition[]): Promise<void>;
  /** Sync a UI context snapshot on the context channel. */
  syncContext(snapshot: IUiContextSnapshot): Promise<void>;
  /** Transcribe audio to text (`POST /api/ai/transcribe`). */
  transcribe(audio: Uint8Array | ArrayBuffer): Promise<{ text: string }>;
  /** Synthesize speech from text (`POST /api/ai/tts`). */
  synthesize(text: string): Promise<ArrayBuffer>;
}
