/**
 * @file navigate-options.interface.ts
 * @module @stackra/contracts/interfaces/routing
 * @description Options passed to `useNavigate()(to, options)` and every
 *   downstream `INavigateAction` dispatched through `@stackra/actions`.
 */

/**
 * Options accepted by `useNavigate()` and every `INavigateAction`.
 */
export interface INavigateOptions {
  /**
   * Whether to replace the current history entry instead of pushing
   * a new one.
   *
   * @default false
   */
  readonly replace?: boolean;

  /**
   * Opaque state associated with the new history entry — retrievable
   * via `useLocation().state` on the destination.
   */
  readonly state?: unknown;

  /**
   * When `true`, the router skips restoring the scroll position on
   * the destination.
   *
   * @default false
   */
  readonly preventScrollReset?: boolean;
}
