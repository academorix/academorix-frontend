/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Barrel export for AI interfaces.
 */

export type { IAiCredentials } from "./ai-credentials.interface";
export type { IAiAuthProvider } from "./ai-auth-provider.interface";
export type {
  IAiConfig,
  IPiiRule,
  IAiContextConfig,
  IAiRetryPolicy,
  IAiSpeechConfig,
} from "./ai-config.interface";
export type { IAiModuleOptions, IAiModuleAsyncOptions } from "./ai-module-options.interface";
export type { IAiStreamEvent } from "./ai-stream-event.interface";
export type { IAiStreamDecoder } from "./ai-stream-decoder.interface";
export type { IAiChatRequest, IAiRequestSpec } from "./ai-request.interface";
export type { IAiTransport } from "./ai-transport.interface";
export type { IAiClient } from "./ai-client.interface";
export type { IAiMessage } from "./ai-message.interface";
export type { IAiSource } from "./ai-source.interface";
export type { IAiConversation } from "./ai-conversation.interface";
export type { IAiThreadSummary } from "./ai-thread-summary.interface";
export type { IAiClientToolDefinition } from "./ai-tool-definition.interface";
export type { IAiToolCall } from "./ai-tool-call.interface";
export type { IAiToolResult } from "./ai-tool-result.interface";
export type { IPersona, IAiAgent } from "./ai-persona.interface";
export type { IAiDraft } from "./ai-draft.interface";
export type { IAiContextFrame } from "./ai-context-frame.interface";
export type {
  IAiContextManager,
  IAiContextFrameContribution,
} from "./ai-context-manager.interface";
export type { IUiContextSnapshot } from "./ui-context-snapshot.interface";
