/**
 * @file overlay-config.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Overlay configuration attached to routes with
 *   `mode: 'dialog' | 'drawer' | 'sheet'`.
 */

/**
 * Overlay behaviour + presentation for a non-`page` route.
 *
 * @example
 * ```typescript
 * definePage({
 *   mode: 'sheet',
 *   overlay: {size: 'md', side: 'right', dismissible: true, fallbackRoute: '/users'},
 * });
 * ```
 */
export interface IOverlayConfig {
  /** Overlay size preset. */
  readonly size?: "sm" | "md" | "lg" | "xl" | "full";

  /** Side the overlay slides in from (drawer + sheet only). */
  readonly side?: "left" | "right" | "top" | "bottom";

  /**
   * Whether the overlay can be dismissed by clicking the backdrop
   * or pressing ESC.
   *
   * @default true
   */
  readonly dismissible?: boolean;

  /**
   * What happens when the overlay is dismissed.
   *
   * - `'back'` — navigate to the previous history entry.
   * - `'to-parent'` — navigate to the parent route in the match chain.
   *
   * @default 'back'
   */
  readonly onDismiss?: "back" | "to-parent";

  /**
   * Route to navigate to when history is empty (or `onDismiss: 'to-parent'`
   * has no parent). Absolute path.
   */
  readonly fallbackRoute?: string;

  /**
   * How the overlay reacts when the wrapped route yields a 404.
   *
   * - `'close'` — close the overlay + navigate to `fallbackRoute`.
   * - `'stay'` — keep the overlay open + render its `NotFoundComponent` inside.
   *
   * @default 'close'
   */
  readonly onError?: "close" | "stay";
}
