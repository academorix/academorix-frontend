/**
 * @file ai-loader.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiLoader` — assistant loading affordance. Composes HeroUI
 *   Pro's `ChatLoader` (dots/pulse/spinner/skeleton) and `TextShimmer`
 *   into a single component keyed by `variant` (Req 20.1, 20.2).
 */

import type { JSX, ReactNode } from "react";
import { ChatLoader, TextShimmer } from "@stackra/ui/react";

/** The loader variant to render. */
export type AiLoaderVariant = "dots" | "pulse" | "spinner" | "skeleton" | "shimmer";

/** Props accepted by {@link AiLoader}. */
export interface IAiLoaderProps {
  /** Loader variant. Defaults to `dots`. */
  variant?: AiLoaderVariant;
  /** Accessible label / shimmer text (defaults to "Thinking..."). */
  label?: ReactNode;
  /** Optional passthrough class. */
  className?: string;
}

/**
 * A HeroUI Pro loader variant selector — chooses between the four
 * `ChatLoader.*` sub-components + a `TextShimmer` fallback for streaming
 * labels.
 */
export function AiLoader(props: IAiLoaderProps): JSX.Element {
  const { variant = "dots", label = "Thinking...", className } = props;
  switch (variant) {
    case "pulse":
      return <ChatLoader.Pulse className={className} />;
    case "spinner":
      return <ChatLoader.Spinner className={className} />;
    case "skeleton":
      return (
        <ChatLoader.Skeleton
          className={className}
          {...(typeof label === "string" ? { "aria-label": label } : {})}
        />
      );
    case "shimmer":
      return <TextShimmer className={className}>{label}</TextShimmer>;
    case "dots":
    default:
      return (
        <ChatLoader.Dots
          className={className}
          {...(typeof label === "string" ? { "aria-label": label } : {})}
        />
      );
  }
}
