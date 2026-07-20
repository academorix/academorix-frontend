/**
 * @file route-history.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description History-control descriptor for a route — controls back
 *   button behaviour, scroll retention, and history reset.
 */

import type { IHistoryOnBack } from "./history-on-back.type";

/**
 * History-control configuration for a route.
 *
 * @example
 * ```typescript
 * definePage({
 *   history: {resetOnEnter: true, preventBack: true, onBack: '/dashboard'},
 * });
 * ```
 */
export interface IRouteHistory {
  /**
   * When `true`, the router clears the back-history stack the first
   * time this route becomes active. Useful for wizard-completion
   * screens where "back" should not return to the wizard.
   *
   * @default false
   */
  readonly resetOnEnter?: boolean;

  /**
   * When `true`, the framework intercepts back navigation and uses
   * `onBack` instead of the default browser back.
   *
   * @default false
   */
  readonly preventBack?: boolean;

  /**
   * Interception strategy applied when `preventBack: true`. When
   * omitted (and `preventBack: true`), defaults to `'to-parent'`.
   *
   * @default 'to-parent'
   */
  readonly onBack?: IHistoryOnBack;

  /**
   * When `true`, the framework preserves the scroll position on
   * this route across navigation cycles.
   *
   * @default false
   */
  readonly keepScroll?: boolean;

  /**
   * Optional scroll key used when `keepScroll: true`. Multiple routes
   * that share a scroll key share a scroll position.
   */
  readonly scrollKey?: string;
}
