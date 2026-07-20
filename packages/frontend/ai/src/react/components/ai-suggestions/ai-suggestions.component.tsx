/**
 * @file ai-suggestions.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiSuggestions` — starter prompts for an empty chat
 *   state. Composes HeroUI Pro's `PromptSuggestion` (Req 20.1, 20.2).
 */

import type { JSX, ReactNode } from "react";
import { PromptSuggestion } from "@stackra/ui/react";

/** A single suggestion. */
export interface IAiSuggestion {
  /** Stable id. */
  id: string;
  /** Displayed title. */
  title: string;
  /** Optional secondary description. */
  description?: string;
}

/** Props accepted by {@link AiSuggestions}. */
export interface IAiSuggestionsProps {
  /** The suggestions to display. */
  suggestions: readonly IAiSuggestion[];
  /** Optional heading title. */
  title?: ReactNode;
  /** Optional heading description. */
  description?: ReactNode;
  /** Invoked when a suggestion is picked. */
  onPick?: (suggestion: IAiSuggestion) => void;
  /** Optional passthrough class. */
  className?: string;
}

/** Suggested prompts for the AI empty state. */
export function AiSuggestions(props: IAiSuggestionsProps): JSX.Element {
  const { suggestions, title, description, onPick, className } = props;
  return (
    <PromptSuggestion className={className}>
      {(title || description) && (
        <PromptSuggestion.Header>
          {title ? <PromptSuggestion.Title>{title}</PromptSuggestion.Title> : null}
          {description ? (
            <PromptSuggestion.Description>{description}</PromptSuggestion.Description>
          ) : null}
        </PromptSuggestion.Header>
      )}
      <PromptSuggestion.Items>
        {suggestions.map((s) => (
          <PromptSuggestion.Item key={s.id} onPress={() => onPick?.(s)}>
            <PromptSuggestion.ItemTitle>{s.title}</PromptSuggestion.ItemTitle>
            {s.description ? (
              <PromptSuggestion.ItemDescription>{s.description}</PromptSuggestion.ItemDescription>
            ) : null}
          </PromptSuggestion.Item>
        ))}
      </PromptSuggestion.Items>
    </PromptSuggestion>
  );
}
