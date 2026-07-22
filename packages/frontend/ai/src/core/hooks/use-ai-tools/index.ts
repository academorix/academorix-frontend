/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-tools
 * @description Entity barrel — re-exports the `useAiTools` hook that reads
 *   the current set of registered AI tools and its `IUseAiToolsResult`
 *   return-shape interface.
 */

export { useAiTools } from "./use-ai-tools.hook";
export type { IUseAiToolsResult } from "./use-ai-tools.hook";
