/**
 * @file default-pending-fallback.interface.ts
 * @module @stackra/routing/react/components/fallbacks/default-pending-fallback
 * @description Props for `<DefaultPendingFallback />`.
 */

/**
 * Props accepted by `<DefaultPendingFallback />`.
 */
export interface IDefaultPendingFallbackProps {
  /**
   * Additional CSS classes appended to the root container.
   */
  readonly className?: string;

  /**
   * Accessible label for the progress region. Read by screen
   * readers on transition start.
   *
   * @default 'Loading page'
   */
  readonly "aria-label"?: string;
}
