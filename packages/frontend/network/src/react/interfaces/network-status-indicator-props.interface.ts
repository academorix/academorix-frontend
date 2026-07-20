/**
 * @file network-status-indicator-props.interface.ts
 * @module @stackra/network/react/interfaces
 * @description Props for the web {@link NetworkStatusIndicator} component.
 */

/**
 * Overridable label strings for {@link NetworkStatusIndicator}.
 *
 * Supply this prop to localize the indicator without pulling an i18n
 * runtime into the network package.
 */
export interface NetworkStatusIndicatorLabels {
  readonly offline?: string;
  readonly slow?: string;
  readonly wifi?: string;
  readonly cellular?: string;
  readonly ethernet?: string;
  readonly unknown?: string;
}

/**
 * Props accepted by {@link NetworkStatusIndicator}.
 */
export interface NetworkStatusIndicatorProps {
  /**
   * Size of the chip indicator.
   *
   * @default 'sm'
   */
  readonly size?: "sm" | "md" | "lg";

  /**
   * HeroUI chip visual variant.
   *
   * @default 'soft'
   */
  readonly variant?: "primary" | "secondary" | "tertiary" | "soft";

  /**
   * Overridable label strings (for i18n).
   */
  readonly labels?: NetworkStatusIndicatorLabels;

  /**
   * Optional Tailwind className for layout overrides.
   */
  readonly className?: string;
}
