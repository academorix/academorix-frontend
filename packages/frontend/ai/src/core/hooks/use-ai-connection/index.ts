/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-connection
 * @description Entity barrel — re-exports the `useAiConnection` hook that
 *   reads the AI transport connection state, together with its
 *   `IUseAiConnectionResult` return-shape interface.
 */

export { useAiConnection } from "./use-ai-connection.hook";
export type { IUseAiConnectionResult } from "./use-ai-connection.hook";
