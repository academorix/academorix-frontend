/**
 * @file ai-suggestion.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description A single proposal on an assistant turn. Suggestions are
 *   individually accept / dismiss-able so the user can cherry-pick when
 *   the assistant returns multiple proposals in one turn.
 */

import type { AiSuggestionKind } from "@/core/types/ai-suggestion-kind.type";

/**
 * AI suggestion payload. `payload` shape depends on {@link kind}:
 *
 * - `add-widget` → `{ widgetType: string; span?: WidgetSpan }`
 * - `reorder` → `{ orderedIds: readonly string[] }`
 * - `rename` → `{ name: string }`
 * - `explain` → `{ summary: string }`
 */
export interface IAiSuggestion {
  /** Stable id — used as the React key + accept/dismiss target. */
  id: string;

  /** Suggestion kind — see the interface docblock. */
  kind: AiSuggestionKind;

  /** Short human summary for the suggestion card header. */
  title: string;

  /** Longer description rendered under the title. */
  description?: string;

  /** Payload — shape depends on `kind`. */
  payload: unknown;
}
