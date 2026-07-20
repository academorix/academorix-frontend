/**
 * @file ai-markdown.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiMarkdown` — thin wrapper around HeroUI Pro's `Markdown`
 *   primitive. Renders assistant markdown with block-level memoization
 *   suitable for streaming updates (Req 20.1, 20.2).
 */

import type { JSX } from "react";
import { Markdown } from "@stackra/ui/react";

/** Props accepted by {@link AiMarkdown}. */
export interface IAiMarkdownProps {
  /** Markdown content to render. */
  children: string;
  /** Optional passthrough class. */
  className?: string;
  /** Stable id seed used for memoized block keys. */
  id?: string;
}

/** Render assistant markdown content. */
export function AiMarkdown(props: IAiMarkdownProps): JSX.Element {
  const { children, ...rest } = props;
  return <Markdown {...rest}>{children}</Markdown>;
}
