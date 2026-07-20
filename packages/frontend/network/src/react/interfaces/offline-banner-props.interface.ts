/**
 * @file offline-banner-props.interface.ts
 * @module @stackra/network/react/interfaces
 * @description Props for the web {@link OfflineBanner} component.
 */

/**
 * Props accepted by {@link OfflineBanner}.
 */
export interface OfflineBannerProps {
  /**
   * Banner title.
   *
   * @default 'You are offline'
   */
  readonly title?: string;

  /**
   * Optional descriptive message rendered under the title.
   */
  readonly message?: string;

  /**
   * Optional Tailwind className for layout overrides.
   */
  readonly className?: string;
}
