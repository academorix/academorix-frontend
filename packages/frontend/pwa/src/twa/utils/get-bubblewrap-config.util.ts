/**
 * @file get-bubblewrap-config.util.ts
 * @module @stackra/pwa/twa/utils
 * @description Build a `twa-manifest.json` from the caller's inputs.
 *
 *   Consumers write the returned object to a JSON file and run
 *   `pnpm dlx @bubblewrap/cli init --manifest=./twa-manifest.json`
 *   to bootstrap the Android project.
 */

import { Str } from '@stackra/support';

import type { IBubblewrapConfigInput, ITwaManifest } from '../interfaces';

/**
 * Derive an Android application id (reverse-DNS package name) from
 * a host string. `example.com` becomes `com.example.twa`.
 *
 * Uses `Str.lower` per the workspace's support-utilities rule.
 */
function deriveApplicationId(host: string): string {
  const cleaned = Str.lower(host);
  const parts = cleaned.split('.').filter(Boolean);
  // Reverse the host parts (`['example','com']` → `['com','example']`)
  // then suffix with `.twa` to distinguish TWA from a native app.
  return [...parts].reverse().concat('twa').join('.');
}

/**
 * Compose the `twa-manifest.json` shape Bubblewrap consumes.
 *
 * @param input - The caller's app metadata and asset URLs.
 * @returns A structurally valid `ITwaManifest` object.
 *
 * @example
 * ```typescript
 * // scripts/generate-twa-manifest.ts
 * import { writeFileSync } from 'node:fs';
 * import { getBubblewrapConfig } from '@stackra/pwa/twa';
 *
 * const manifest = getBubblewrapConfig({
 *   host: 'app.stackra.com',
 *   name: 'Stackra',
 *   launcherName: 'Stackra',
 *   manifestUrl: 'https://app.stackra.com/manifest.webmanifest',
 *   startUrl: '/',
 *   themeColor: '#0EA5E9',
 *   backgroundColor: '#FFFFFF',
 *   iconUrl: 'https://app.stackra.com/pwa-512.png',
 * });
 * writeFileSync('./twa-manifest.json', JSON.stringify(manifest, null, 2));
 * ```
 */
export function getBubblewrapConfig(input: IBubblewrapConfigInput): ITwaManifest {
  const {
    host,
    name,
    launcherName,
    manifestUrl,
    startUrl,
    themeColor,
    backgroundColor,
    navigationColor,
    navigationColorDark,
    iconUrl,
    maskableIconUrl,
    monochromeIconUrl,
    display = 'standalone',
    orientation = 'any',
    shortcuts,
    signing,
    minSdkVersion = 21,
    applicationId,
    versionCode = 1,
    versionName = '1.0.0',
  } = input;

  // Application id — either caller-provided (recommended for stability
  // across releases) or derived once from the host.
  const packageId = applicationId ?? deriveApplicationId(host);

  return {
    packageId,
    host,
    name,
    launcherName,
    display,
    orientation,
    themeColor,
    // Bubblewrap ties `navigationColor` to the Android status bar;
    // fall back to `themeColor` so the theming stays coherent.
    navigationColor: navigationColor ?? themeColor,
    navigationColorDark: navigationColorDark ?? '#000000',
    backgroundColor,
    // Enable push notifications by default — users still see the
    // permission prompt inside the TWA.
    enableNotifications: true,
    startUrl,
    iconUrl,
    ...(maskableIconUrl ? { maskableIconUrl } : {}),
    ...(monochromeIconUrl ? { monochromeIconUrl } : {}),
    splashScreenFadeOutDuration: 300,
    ...(signing?.keystorePath || signing?.keyAlias
      ? {
          signingKey: {
            ...(signing?.keystorePath ? { path: signing.keystorePath } : {}),
            ...(signing?.keyAlias ? { alias: signing.keyAlias } : {}),
          },
        }
      : {}),
    appVersionName: versionName,
    appVersionCode: versionCode,
    // Bubblewrap accepts an empty array; the mapping is spec-simple.
    shortcuts:
      shortcuts?.map((s) => ({
        name: s.name,
        ...(s.shortName ? { shortName: s.shortName } : {}),
        url: s.url,
        ...(s.iconUrl ? { iconUrl: s.iconUrl } : {}),
      })) ?? [],
    generatorApp: '@stackra/pwa',
    webManifestUrl: manifestUrl,
    fallbackType: 'customtabs',
    features: {},
    minSdkVersion,
  };
}
