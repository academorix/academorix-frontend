/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-chat
 * @description Entity barrel — re-exports the `useAiChat` hook that drives
 *   an AI thread against the `ChatOrchestrator`, along with its options
 *   and result-shape interfaces.
 */

export { useAiChat } from "./use-ai-chat.hook";
export type { IUseAiChatOptions, IUseAiChatResult } from "./use-ai-chat.hook";
