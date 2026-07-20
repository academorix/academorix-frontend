/**
 * @file default-not-found-fallback.interface.ts
 * @module @stackra/routing/react/components/fallbacks/default-not-found-fallback
 * @description Props for `<DefaultNotFoundFallback />`.
 */

import type { ReactNode } from "react";

/**
 * Action affordance rendered in the not-found state's footer.
 */
export interface IDefaultNotFoundFallbackAction {
  /** Button label. */
  readonly label: string;

  /** Press handler wired to the button. */
  readonly onPress: () => void;
}

/**
 * Props accepted by `<DefaultNotFoundFallback />`.
 */
export interface IDefaultNotFoundFallbackProps {
  /**
   * Primary heading text.
   *
   * @default 'Page not found'
   */
  readonly title?: string;

  /**
   * Supporting body copy.
   *
   * @default "The URL doesn't match any route in this app."
   */
  readonly description?: string;

  /**
   * Optional icon rendered inside `EmptyState.Media` with the
   * `variant="icon"` treatment. Defaults to a "magnifier" glyph
   * from the gravity-ui set — the canonical "nothing found"
   * affordance.
   */
  readonly icon?: ReactNode;

  /**
   * Home-button spec. When omitted the framework defaults to a
   * `'Go home'` label pointing at `/`. Consumers override the
   * label + press handler to point at a tenant-scoped landing
   * page.
   */
  readonly action?: IDefaultNotFoundFallbackAction;

  /**
   * When `true`, hide the action button entirely (useful for
   * inline 404 renders inside a dialog / drawer / sheet where the
   * caller owns the primary action).
   *
   * @default false
   */
  readonly hideAction?: boolean;

  /**
   * Additional CSS classes appended to the outer wrapper.
   */
  readonly className?: string;
}
