/**
 * @file timeline-steps.tsx
 * @module components/marketing/timeline-steps
 *
 * @description
 * Numbered horizontal timeline used by the landing "how it works"
 * section. Each step is an icon tile plus a two-word title and a
 * one-sentence description. On mobile the timeline stacks; on
 * desktop it lays out as a four-column grid connected by a hairline
 * divider so the sequence reads at a glance.
 */

import clsx from "clsx";

import type { Localized } from "@/lib/types";
import type { HomeHowStep } from "@/lib/types";

import { resolveIcon } from "@/lib/icon-registry";

/** Props for {@link TimelineSteps}. */
export interface TimelineStepsProps {
  /** Ordered steps. */
  items: readonly Localized<HomeHowStep>[];
  /** Wrapper class overrides. */
  className?: string;
}

/** Renders a numbered timeline of marketing "how it works" steps. */
export function TimelineSteps({ items, className }: TimelineStepsProps) {
  return (
    <ol
      className={clsx("relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {items.map((step) => {
        const Icon = resolveIcon(step.icon);

        return (
          <li
            key={step.number}
            className="flex flex-col gap-4 rounded-2xl border border-default/40 bg-surface/60 p-6 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-content-center rounded-xl bg-default/60 text-foreground">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="font-mono text-xs font-medium tracking-widest text-muted">
                {step.number}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm text-muted">{step.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
