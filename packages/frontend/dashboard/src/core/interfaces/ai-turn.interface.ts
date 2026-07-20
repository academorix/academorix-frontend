/**
 * @file ai-turn.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single message in the copilot chat history. `user`
 *   turns carry the raw prompt; `assistant` turns carry the reply plus
 *   (optionally) a list of {@link IAiSuggestion}s.
 */

import type { IAiSuggestion } from "./ai-suggestion.interface";

/**
 * Chat-log turn. Ephemeral state — resets when the customise panel
 * closes.
 */
export interface IAiTurn {
  /** Stable id — used as the React key. */
  id: string;

  /** Turn role. */
  role: "user" | "assistant";

  /** Message content. */
  content: string;

  /** ISO-8601 timestamp — used for the "Xm ago" caption. */
  createdAt: string;

  /** Only populated on assistant turns. */
  suggestions?: IAiSuggestion[];
}
