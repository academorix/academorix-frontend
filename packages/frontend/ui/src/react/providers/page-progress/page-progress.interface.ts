/**
 * @file page-progress.interface.ts
 * @module @stackra/ui/react/providers/page-progress
 * @description Interfaces for the PageProgress provider and context.
 */

import type { ReactNode } from "react";

// ============================================================================
// Context Value
// ============================================================================

/** Context value exposed by PageProgressProvider. */
export interface IPageProgressContextValue {
  /** Start the progress bar animation (begins at 0, increments to ~90%). */
  start: () => void;

  /** Complete the progress bar (jumps to 100% then hides). */
  done: () => void;

  /** Increment progress by a small random amount. */
  increment: () => void;

  /** Whether the progress bar is currently animating. */
  isAnimating: boolean;

  /** Current progress value (0-100). */
  progress: number;
}

// ============================================================================
// Provider Props
// ============================================================================

/** Props for the PageProgressProvider. */
export interface PageProgressProviderProps {
  /** App content. */
  children: ReactNode;

  /** Color of the progress bar. Defaults to HeroUI accent. */
  color?: string;

  /** Height of the bar in pixels. Defaults to 3. */
  height?: number;

  /** Minimum progress value when starting. Defaults to 8. */
  minimum?: number;

  /** Speed of the trickle increment in ms. Defaults to 200. */
  trickleSpeed?: number;

  /** Z-index for the progress bar. Defaults to 9999. */
  zIndex?: number;
}
