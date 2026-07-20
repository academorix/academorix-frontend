/**
 * @file twa-manifest.interface.ts
 * @module @stackra/pwa/twa/interfaces
 * @description Shape of the `twa-manifest.json` Bubblewrap consumes.
 *
 *   Mirrors the file shape Bubblewrap's CLI (`bubblewrap init`) both
 *   reads and writes. Kept as a package-owned interface so consumers
 *   don't have to install `@bubblewrap/cli`'s types just for a
 *   structural annotation.
 */

/**
 * `twa-manifest.json` shape emitted by
 * {@link getBubblewrapConfig}.
 *
 * Type is intentionally partial-permissive — the tail
 * `[key: string]: unknown` lets the caller extend with fields new
 * Bubblewrap versions add without a cast.
 */
export interface ITwaManifest {
  readonly packageId?: string;
  readonly host: string;
  readonly name: string;
  readonly launcherName: string;
  readonly display: "standalone" | "fullscreen" | "minimal-ui";
  readonly orientation: "any" | "portrait" | "landscape";
  readonly themeColor: string;
  readonly navigationColor: string;
  readonly navigationColorDark: string;
  readonly backgroundColor: string;
  readonly enableNotifications: boolean;
  readonly startUrl: string;
  readonly iconUrl: string;
  readonly maskableIconUrl?: string;
  readonly monochromeIconUrl?: string;
  readonly splashScreenFadeOutDuration: number;
  readonly signingKey?: {
    readonly path?: string;
    readonly alias?: string;
  };
  readonly appVersionName: string;
  readonly appVersionCode: number;
  readonly shortcuts: readonly {
    readonly name: string;
    readonly shortName?: string;
    readonly url: string;
    readonly iconUrl?: string;
  }[];
  readonly generatorApp: string;
  readonly webManifestUrl: string;
  readonly fallbackType: "customtabs" | "webview";
  readonly features: {
    readonly appsFlyer?: { readonly enabled: boolean };
    readonly locationDelegation?: { readonly enabled: boolean };
    readonly playBilling?: { readonly enabled: boolean };
  };
  readonly minSdkVersion: number;
  readonly [key: string]: unknown;
}
