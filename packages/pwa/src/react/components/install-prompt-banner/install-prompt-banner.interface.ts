/**
 * @file install-prompt-banner.interface.ts
 * @module @stackra/pwa/react/components
 * @description Props for the `<InstallPromptBanner>` component.
 */

/**
 * Props accepted by {@link InstallPromptBanner}.
 */
export interface InstallPromptBannerProps {
  /** Banner title. @default 'Install this app' */
  readonly title?: string;
  /** Banner body copy. */
  readonly description?: string;
  /** Label of the primary action button. @default 'Install' */
  readonly installLabel?: string;
  /** Label of the dismiss action button. @default 'Not now' */
  readonly dismissLabel?: string;
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
  /**
   * Callback fired when the user accepts the install (either the
   * Chromium prompt or the iOS Safari tutorial's "Done" affordance).
   */
  readonly onInstall?: () => void;
  /** Callback fired when the user dismisses the banner. */
  readonly onDismiss?: () => void;
}
