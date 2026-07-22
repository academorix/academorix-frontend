/**
 * @file index.ts
 * @module @stackra/ai/core/hooks/use-ai-catalog
 * @description Entity barrel — re-exports the `useAiCatalog` hook that reads
 *   the merged persona catalog and its `IUseAiCatalogResult` return shape.
 */

export { useAiCatalog } from "./use-ai-catalog.hook";
export type { IUseAiCatalogResult } from "./use-ai-catalog.hook";
