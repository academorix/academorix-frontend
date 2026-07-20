/**
 * @file ai-reasoning.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiReasoning` — assistant chain-of-thought / reasoning
 *   trace. Composes HeroUI Pro's `ChainOfThought` (Req 20.1, 20.2).
 */

import type { JSX, ReactNode } from "react";
import { ChainOfThought } from "@stackra/ui/react";

/** A single reasoning step. */
export interface IAiReasoningStep {
  /** Optional step label rendered above the content. */
  label?: ReactNode;
  /** Step body. */
  content: ReactNode;
}

/** Props accepted by {@link AiReasoning}. */
export interface IAiReasoningProps {
  /** Reasoning steps. */
  steps: readonly IAiReasoningStep[];
  /** Trigger label (e.g. "Thought for 3s"). */
  triggerLabel?: ReactNode;
  /** Whether reasoning is still streaming (shimmers the trigger). */
  isStreaming?: boolean;
  /** Whether the disclosure is open by default. */
  defaultExpanded?: boolean;
  /** Optional passthrough class. */
  className?: string;
}

/** Chain-of-thought / reasoning trace. */
export function AiReasoning(props: IAiReasoningProps): JSX.Element {
  const {
    steps,
    triggerLabel = "Reasoning",
    isStreaming = false,
    defaultExpanded = false,
    className,
  } = props;
  return (
    <ChainOfThought
      className={className}
      isStreaming={isStreaming}
      defaultExpanded={defaultExpanded}
    >
      <ChainOfThought.Trigger>{triggerLabel}</ChainOfThought.Trigger>
      <ChainOfThought.Content>
        <ChainOfThought.Steps>
          {steps.map((step, i) => (
            <ChainOfThought.Step
              key={i}
              {...(step.label !== undefined ? { label: step.label } : {})}
            >
              {step.content}
            </ChainOfThought.Step>
          ))}
        </ChainOfThought.Steps>
      </ChainOfThought.Content>
    </ChainOfThought>
  );
}
