/**
 * @file ai-sources.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiSources` — grouped citation list. Composes HeroUI Pro's
 *   `ChatSource` + `ChatSources` (Req 20.1, 20.2).
 */

import type { JSX } from "react";
import { ChatSource, ChatSources } from "@stackra/ui/react";
import type { IAiSource } from "@stackra/contracts";

/** Props accepted by {@link AiSources}. */
export interface IAiSourcesProps {
  /** Sources to render. */
  sources: readonly IAiSource[];
  /** Optional passthrough class. */
  className?: string;
  /** Whether the group is expanded by default. */
  defaultExpanded?: boolean;
}

/** Render assistant message citations. */
export function AiSources(props: IAiSourcesProps): JSX.Element | null {
  const { sources, className, defaultExpanded = false } = props;
  if (!sources || sources.length === 0) return null;

  if (sources.length === 1) {
    const source = sources[0]!;
    return (
      <ChatSource
        className={className}
        {...(source.url !== undefined ? { href: source.url } : {})}
        title={source.title}
        {...(source.snippet !== undefined ? { description: source.snippet } : {})}
      />
    );
  }

  return (
    <ChatSources className={className} defaultExpanded={defaultExpanded}>
      <ChatSources.Trigger>{sources.length} sources</ChatSources.Trigger>
      <ChatSources.Content>
        <ChatSources.List>
          {sources.map((source) => (
            <ChatSource
              key={source.id}
              {...(source.url !== undefined ? { href: source.url } : {})}
              title={source.title}
              {...(source.snippet !== undefined ? { description: source.snippet } : {})}
            />
          ))}
        </ChatSources.List>
      </ChatSources.Content>
    </ChatSources>
  );
}
