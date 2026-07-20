/**
 * @file src/react/index.ts
 * @module @stackra/ai/react
 * @description Public API for the web bindings of `@stackra/ai` (the
 *   `./react` subpath): the web platform module, `AiProvider`, the
 *   cross-platform hooks, and the wired HeroUI Pro components (populated
 *   by task 12).
 */

// ══════════════════════════════════════════════════════════════════════
// Web platform module
// ══════════════════════════════════════════════════════════════════════
export { WebAiModule } from "./web-ai.module";

// ══════════════════════════════════════════════════════════════════════
// Providers
// ══════════════════════════════════════════════════════════════════════
export { AiProvider } from "./providers";
export type { IAiProviderProps } from "./providers";

// ══════════════════════════════════════════════════════════════════════
// Wired HeroUI Pro components (web only — task 12)
// ══════════════════════════════════════════════════════════════════════
export {
  AiChat,
  AiContextIndicator,
  AiLoader,
  AiMarkdown,
  AiMessage,
  AiPrompt,
  AiReasoning,
  AiSources,
  AiSuggestions,
  AiThreadList,
  AiToolCall,
} from "./components";
export type {
  AiLoaderVariant,
  IAiChatProps,
  IAiContextIndicatorProps,
  IAiLoaderProps,
  IAiMarkdownProps,
  IAiMessageProps,
  IAiPromptProps,
  IAiReasoningProps,
  IAiReasoningStep,
  IAiSourcesProps,
  IAiSuggestion,
  IAiSuggestionsProps,
  IAiThreadListProps,
  IAiToolCallProps,
} from "./components";

// ══════════════════════════════════════════════════════════════════════
// Hooks (cross-platform — re-exported from core so the native subpath
// consumes the same source).
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
} from "@/core/hooks";
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
} from "@/core/hooks";

// ══════════════════════════════════════════════════════════════════════
// Authoring helpers re-exported for the web subpath's DX
// ══════════════════════════════════════════════════════════════════════
export { defineAiTool } from "@/core/utils";
export type { IAiToolDefinition } from "@/core/utils";

// ══════════════════════════════════════════════════════════════════════
// Devtools contribution — wired into `DevtoolsModule` by `AiModule.forRoot`.
// ══════════════════════════════════════════════════════════════════════
export { AiDevtoolsPanel, AiDevtoolsPanelView, type AiDevtoolsPanelViewProps } from "./devtools";
