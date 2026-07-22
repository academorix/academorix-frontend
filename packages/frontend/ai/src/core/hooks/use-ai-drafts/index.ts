/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-drafts
 * @description Entity barrel — re-exports the `useAiDrafts` hook that reads
 *   pending draft-then-confirm tool writes and its `IUseAiDraftsResult`
 *   return-shape interface.
 */

export { useAiDrafts } from "./use-ai-drafts.hook";
export type { IUseAiDraftsResult } from "./use-ai-drafts.hook";
