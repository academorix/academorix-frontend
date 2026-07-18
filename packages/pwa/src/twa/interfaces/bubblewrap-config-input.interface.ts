/**
 * @file bubblewrap-config-input.interface.ts
 * @module @stackra/pwa/twa/interfaces
 * @description Input shape for `getBubblewrapConfig(input)`.
 */

/**
 * Input to `getBubblewrapConfig`.
 *
 * Bubblewrap wraps a PWA as a Trusted Web Activity (Android APK /
 * AAB). Consumers run `pnpm dlx @bubblewrap/cli init
 * --manifest=./twa-manifest.json` with the emitted file.
 */
export interface IBubblewrapConfigInput {
  /**
   * Host name of the PWA (no scheme). Bubblewrap uses this to derive
   * the app's package name and Digital Asset Links.
   */
  readonly host: string;
  /** Human-readable full app name. */
  readonly name: string;
  /** Launcher name (≤ 30 chars per Android HIG). */
  readonly launcherName: string;
  /** Absolute URL to the manifest.webmanifest for reference. */
  readonly manifestUrl: string;
  /** Start URL relative to the host. */
  readonly startUrl: string;
  /** Theme colour. */
  readonly themeColor: string;
  /** Splash background colour. */
  readonly backgroundColor: string;
  /**
   * Colour of the Android status bar (fallback: `themeColor`).
   */
  readonly navigationColor?: string;
  /**
   * Colour of the Android navigation bar (fallback: `#000000`).
   */
  readonly navigationColorDark?: string;
  /** URL of the launcher icon. */
  readonly iconUrl: string;
  /** URL of the maskable launcher icon. */
  readonly maskableIconUrl?: string;
  /** URL of the monochrome icon (Android 13+ themed icons). */
  readonly monochromeIconUrl?: string;
  /** URL of the splash image (usually the same as the maskable icon). */
  readonly splashImageUrl?: string;
  /** Display mode Bubblewrap should honour. */
  readonly display?: 'standalone' | 'fullscreen' | 'minimal-ui';
  /** Orientation preference. */
  readonly orientation?: 'any' | 'portrait' | 'landscape';
  /** Home-screen shortcuts. */
  readonly shortcuts?: readonly {
    readonly name: string;
    readonly shortName?: string;
    readonly url: string;
    readonly iconUrl?: string;
  }[];
  /**
   * Signing config placeholders — the actual keystore lives outside
   * the manifest and is picked up by `bubblewrap build`.
   */
  readonly signing?: {
    readonly keystorePath?: string;
    readonly keyAlias?: string;
  };
  /**
   * Minimum SDK version. Defaults to 21 (Android 5.0) so TWAs work
   * on every device that supports Chrome ≥ 72.
   *
   * @default 21
   */
  readonly minSdkVersion?: number;
  /** Application id (reverse DNS). */
  readonly applicationId?: string;
  /** Version code (integer). */
  readonly versionCode?: number;
  /** Version name (semver-ish string). */
  readonly versionName?: string;
}
