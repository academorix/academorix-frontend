/**
 * @file ai-loader.component.tsx
 * @module @stackra/ai/native/components
 * @description `AiLoader` (native) — assistant loading affordance for
 *   React Native. Composes HeroUI Native's `Spinner` with an optional
 *   caption `Typography.Paragraph`.
 *
 *   HeroUI Native ships a single `Spinner` compound today (dots-style
 *   variants come from HeroUI Pro's Native tier once available). The web
 *   `AiLoader`'s five-variant taxonomy (`dots`/`pulse`/`spinner`/
 *   `skeleton`/`shimmer`) collapses down to `spinner` + `dots` on
 *   native, both mapped to the HeroUI `Spinner` root.
 */

import type { JSX } from "react";
import { View } from "react-native";
import { Spinner, Typography } from "@stackra/ui/native";

/** The loader variant to render. */
export type AiLoaderVariant = "dots" | "spinner";

/** Props accepted by {@link AiLoader}. */
export interface IAiLoaderProps {
  /** Loader variant. Defaults to `spinner`. */
  variant?: AiLoaderVariant;
  /** Accessible label / streaming caption (defaults to "Thinking…"). */
  label?: string;
  /** Passthrough class for composition. */
  className?: string;
}

/** Assistant loading affordance. */
export function AiLoader(props: IAiLoaderProps): JSX.Element {
  const { variant = "spinner", label = "Thinking…", className } = props;

  return (
    <View
      className={`flex-row items-center gap-2 py-2${className ? ` ${className}` : ""}`}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <Spinner size={variant === "dots" ? "sm" : "md"} color="default" />
      {label ? (
        <Typography type="body-sm" color="muted">
          {label}
        </Typography>
      ) : null}
    </View>
  );
}
