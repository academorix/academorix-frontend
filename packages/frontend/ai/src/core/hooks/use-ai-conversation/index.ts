/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-conversation
 * @description Entity barrel — re-exports the `useAiConversation` hook that
 *   subscribes to a single AI thread's messages and its
 *   `IUseAiConversationResult` return-shape interface.
 */

export { useAiConversation } from "./use-ai-conversation.hook";
export type { IUseAiConversationResult } from "./use-ai-conversation.hook";
