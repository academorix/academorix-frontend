/**
 * @file pwa-head.interface.ts
 * @module @stackra/pwa/react/components
 * @description Props for the `<PwaHead>` meta emitter.
 */

/** A single Apple touch icon entry. */
export interface IPwaHeadAppleIcon {
  /** Absolute or relative icon URL. */
  readonly href: string;
  /**
   * Icon dimensions in the `NxN` form. iOS uses `180x180` on
   * modern iPhones; iPads also want `152x152`.
   */
  readonly sizes?: string;
}

/** A single Apple splash startup image entry. */
export interface IPwaHeadAppleStartupImage {
  /** Splash image URL. */
  readonly href: string;
  /**
   * `media` query used by iOS to pick the right image per device.
   * Consumers typically emit one entry per device from
   * `@vite-pwa/assets-generator`.
   */
  readonly media: string;
}

/**
 * Props accepted by {@link PwaHead}.
 *
 * The component emits a set of `<link>` and `<meta>` tags into the
 * document head — apps that don't want to manage them by hand mount
 * `<PwaHead>` once at the root of the tree.
 */
export interface PwaHeadProps {
  /**
   * Path to the Web App Manifest. Defaults to
   * `'/manifest.webmanifest'` (Vite's default output name).
   */
  readonly manifestHref?: string;
  /** Theme colour matching the manifest. */
  readonly themeColor?: string;
  /** Apple touch icons — rendered as `<link rel="apple-touch-icon">`. */
  readonly appleIcons?: readonly IPwaHeadAppleIcon[];
  /**
   * Apple startup images — rendered as
   * `<link rel="apple-touch-startup-image">`. Consumers pass the
   * output of `@vite-pwa/assets-generator` verbatim.
   */
  readonly appleStartupImages?: readonly IPwaHeadAppleStartupImage[];
  /**
   * Apple status-bar style. Chromium ignores it; iOS reads it when
   * the app is launched standalone.
   *
   * @default 'default'
   */
  readonly appleStatusBarStyle?: "default" | "black" | "black-translucent";
  /**
   * The "capable" flag iOS uses to decide whether the app can boot
   * standalone from the home screen.
   *
   * @default true
   */
  readonly appleWebAppCapable?: boolean;
  /**
   * App title shown under the icon on the home screen.
   */
  readonly appleWebAppTitle?: string;
}
