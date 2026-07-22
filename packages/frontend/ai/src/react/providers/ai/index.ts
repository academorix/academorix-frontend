/**
 * @file index.ts
 * @module @stackra/ai/react/providers/ai
 * @description Entity barrel — re-exports the top-level `AiProvider` React
 *   provider along with its `IAiProviderProps` interface, and the
 *   `LeaderGate` cross-tab leader-election helper.
 */

export { AiProvider } from "./ai.provider";
export type { IAiProviderProps } from "./ai.provider";

export { LeaderGate } from "./leader-gate.component";
