/**
 * @file consent-banner-props.interface.ts
 * @module @stackra/consent/react/interfaces
 * @description Props for the `<ConsentBanner>` component.
 */

/**
 * Props accepted by {@link ConsentBanner}.
 */
export interface ConsentBannerProps {
  /**
   * Locale key used to resolve locale-keyed category labels/descriptions
   * (e.g. `'en'`, `'ar'`). Defaults to `'en'`.
   */
  readonly locale?: string;
  /** Optional className for layout overrides on the outer container. */
  readonly className?: string;
  /** Banner title. Defaults to `'We value your privacy'`. */
  readonly title?: string;
  /** Banner description. Defaults to a generic consent message. */
  readonly description?: string;
}
