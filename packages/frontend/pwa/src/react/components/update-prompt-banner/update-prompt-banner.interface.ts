/**
 * @file update-prompt-banner.interface.ts
 * @module @stackra/pwa/react/components
 * @description Props for the `<UpdatePromptBanner>` component.
 */

/**
 * Props accepted by {@link UpdatePromptBanner}.
 */
export interface UpdatePromptBannerProps {
  /** Banner title. @default 'Update available' */
  readonly title?: string;
  /** Banner body copy. */
  readonly message?: string;
  /** Label of the primary action. @default 'Refresh' */
  readonly updateLabel?: string;
  /** Label of the dismiss action. @default 'Later' */
  readonly dismissLabel?: string;
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
}
