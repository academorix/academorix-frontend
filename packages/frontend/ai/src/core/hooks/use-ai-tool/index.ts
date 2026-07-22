/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-tool
 * @description Entity barrel — re-exports the `useAiTool` hook that registers
 *   a single client-side AI tool while its host is mounted, plus the
 *   `createAiTool` factory that returns a paired hook + typed definition
 *   for a given handler.
 */

export { useAiTool } from "./use-ai-tool.hook";
export { createAiTool } from "./create-ai-tool.factory";
export type { AiToolHook, IAiToolDefinitionWithHandler } from "./create-ai-tool.factory";
