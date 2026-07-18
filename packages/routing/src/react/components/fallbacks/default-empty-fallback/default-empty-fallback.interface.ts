/**
 * @file default-empty-fallback.interface.ts
 * @module @stackra/routing/react/components/fallbacks/default-empty-fallback
 * @description Props for `<DefaultEmptyFallback />`.
 */

import type { ReactNode } from "react";

/**
 * Action affordance in the empty state's footer — a title + press
 * handler pair. Rendered as a HeroUI `<Button>` in the
 * `EmptyState.Content` slot.
 */
export interface IDefaultEmptyFallbackAction {
  /** Button label — Title Case, no ALL-CAPS. */
  readonly label: string;

  /** Press handler wired to the button's `onPress`. */
  readonly onPress: () => void;
}

/**
 * Props accepted by `<DefaultEmptyFallback />`.
 */
export interface IDefaultEmptyFallbackProps {
  /**
   * Heading text — the "why is this empty" message.
   *
   * @default 'Nothing here yet'
   */
  readonly title?: string;

  /**
   * Supporting body copy — one to two sentences explaining what
   * the user can do next.
   *
   * @default 'This route returned no data. Try adjusting filters or come back later.'
   */
  readonly description?: string;

  /**
   * Optional icon rendered inside `EmptyState.Media` with the
   * `variant="icon"` circular treatment. When omitted the empty
   * state renders without a media slot — cleaner for cases where
   * the icon adds no information.
   */
  readonly icon?: ReactNode;

  /**
   * Optional primary action (typically "Create X" or "Refresh").
   */
  readonly action?: IDefaultEmptyFallbackAction;

  /**
   * Additional CSS classes appended to the outer wrapper. Layout
   * only — HeroUI's `<EmptyState>` owns every visual concern.
   */
  readonly className?: string;
}
