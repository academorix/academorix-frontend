/**
 * @file default-loading-fallback.interface.ts
 * @module @stackra/routing/react/components/fallbacks/default-loading-fallback
 * @description Props for `<DefaultLoadingFallback />`.
 */

/**
 * Props accepted by `<DefaultLoadingFallback />`.
 */
export interface IDefaultLoadingFallbackProps {
  /**
   * Additional CSS classes appended to the root container. Layout
   * only — the skeleton bars own their visual treatment.
   */
  readonly className?: string;

  /**
   * Accessible label read by screen readers for the region. Default
   * is `'Loading'`.
   */
  readonly "aria-label"?: string;
}
