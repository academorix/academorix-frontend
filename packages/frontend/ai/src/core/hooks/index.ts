/**
 * @file index.ts
 * @module @stackra/ai/core/hooks
 * @description Cross-platform React hooks — pure React + `@stackra/container/react`
 *   with no DOM APIs. Re-exported by both the `./react` and `./native`
 *   subpaths so web and RN consumers see the same authoring surface.
 */

export { useAiTool, createAiTool } from './use-ai-tool';
export type { AiToolHook, IAiToolDefinitionWithHandler } from './use-ai-tool';

export { useAiContextFrame } from './use-ai-context-frame';
export type { IUseAiContextFrameOptions } from './use-ai-context-frame';

export { useAiContext } from './use-ai-context';
export type { IUseAiContextResult } from './use-ai-context';

export { useAiConnection } from './use-ai-connection';
export type { IUseAiConnectionResult } from './use-ai-connection';

export { useAiConversation } from './use-ai-conversation';
export type { IUseAiConversationResult } from './use-ai-conversation';

export { useAiThreads } from './use-ai-threads';
export type { IUseAiThreadsResult } from './use-ai-threads';

export { useAiTools } from './use-ai-tools';
export type { IUseAiToolsResult } from './use-ai-tools';

export { useAiDrafts } from './use-ai-drafts';
export type { IUseAiDraftsResult } from './use-ai-drafts';

export { useAiCatalog } from './use-ai-catalog';
export type { IUseAiCatalogResult } from './use-ai-catalog';

export { useAiChat } from './use-ai-chat';
export type { IUseAiChatOptions, IUseAiChatResult } from './use-ai-chat';
