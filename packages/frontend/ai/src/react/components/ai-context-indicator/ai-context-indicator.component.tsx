/**
 * @file ai-context-indicator.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiContextIndicator` — a compact chip surfacing how many
 *   context frames are currently registered. Clicking opens a popover
 *   with the ordered focus stack (topmost first). Composed from HeroUI
 *   OSS `Chip` + `Popover` (Req 20.1, 20.2, 20.5).
 */

import type { JSX } from "react";
import { Chip, Popover } from "@stackra/ui/react";

import { useAiContext } from "@/core/hooks/use-ai-context";

/** Props accepted by {@link AiContextIndicator}. */
export interface IAiContextIndicatorProps {
  /** Optional passthrough class. */
  className?: string;
}

/** A read-only indicator + popover of the current UI context stack. */
export function AiContextIndicator(props: IAiContextIndicatorProps): JSX.Element {
  const { className } = props;
  const { stack, count } = useAiContext();

  return (
    <Popover>
      <Popover.Trigger>
        <Chip
          className={className}
          aria-label={`AI context: ${count} frame${count === 1 ? "" : "s"}`}
          size="sm"
        >
          {count} context frame{count === 1 ? "" : "s"}
        </Chip>
      </Popover.Trigger>
      <Popover.Content className="max-w-sm">
        <Popover.Dialog className="flex flex-col gap-2 p-3">
          <p className="text-muted text-xs">Focus stack (topmost first)</p>
          {stack.length === 0 ? (
            <p className="text-muted text-sm">No context frames registered.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {stack.map((frame) => (
                <li key={`${frame.scope ?? ""}::${frame.key}::${frame.seq}`}>
                  <span className="font-mono text-xs">{frame.key}</span>
                  <span className="text-muted ml-2 text-xs">priority {frame.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
