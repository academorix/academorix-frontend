/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-context-frame
 * @description Entity barrel — re-exports the `useAiContextFrame` hook that
 *   contributes a scoped context frame to the AI request builder while the
 *   host component is mounted, along with its options interface.
 */

export { useAiContextFrame } from "./use-ai-context-frame.hook";
export type { IUseAiContextFrameOptions } from "./use-ai-context-frame.hook";
