/**
 * @file src/native/index.ts
 * @module @stackra/ai/native
 * @description React Native bindings for `@stackra/ai` (the `./native`
 *   subpath): the `NativeAiModule` (binds the same `SseTransport` — SSE
 *   works over RN's `fetch` streaming) plus the cross-platform hooks
 *   sourced from `core/hooks` and native components built on HeroUI
 *   Native compound primitives via `@stackra/ui/native`.
 */

// ══════════════════════════════════════════════════════════════════════
// Native platform module
// ══════════════════════════════════════════════════════════════════════
export { NativeAiModule } from './native-ai.module';

// ══════════════════════════════════════════════════════════════════════
// Wired native components (HeroUI Native compound primitives)
// ══════════════════════════════════════════════════════════════════════
export { AiChat, AiLoader, AiMessage, AiPrompt, AiThreadList, AiToolCall } from './components';
export type {
  AiLoaderVariant,
  IAiChatProps,
  IAiLoaderProps,
  IAiMessageProps,
  IAiPromptProps,
  IAiThreadListProps,
  IAiToolCallProps,
} from './components';

// ══════════════════════════════════════════════════════════════════════
// Hooks (cross-platform — same source as the `./react` subpath).
// ══════════════════════════════════════════════════════════════════════
export {
  createAiTool,
  useAiCatalog,
  useAiChat,
  useAiConnection,
  useAiContext,
  useAiContextFrame,
  useAiConversation,
  useAiDrafts,
  useAiThreads,
  useAiTool,
  useAiTools,
} from '@/core/hooks';
export type {
  AiToolHook,
  IAiToolDefinitionWithHandler,
  IUseAiCatalogResult,
  IUseAiChatOptions,
  IUseAiChatResult,
  IUseAiConnectionResult,
  IUseAiContextFrameOptions,
  IUseAiContextResult,
  IUseAiConversationResult,
  IUseAiDraftsResult,
  IUseAiThreadsResult,
  IUseAiToolsResult,
} from '@/core/hooks';

// ══════════════════════════════════════════════════════════════════════
// Authoring helpers re-exported for the native subpath's DX
// ══════════════════════════════════════════════════════════════════════
export { defineAiTool } from '@/core/utils';
export type { IAiToolDefinition } from '@/core/utils';
