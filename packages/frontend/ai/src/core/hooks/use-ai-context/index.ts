/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-context
 * @description Entity barrel — re-exports the `useAiContext` hook that reads
 *   the merged AI request context (frames + user + tenant + scope) and its
 *   `IUseAiContextResult` return-shape interface.
 */

export { useAiContext } from "./use-ai-context.hook";
export type { IUseAiContextResult } from "./use-ai-context.hook";
