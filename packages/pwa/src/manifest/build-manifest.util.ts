/**
 * @file build-manifest.util.ts
 * @module @academorix/pwa/manifest/build-manifest.util
 *
 * @description
 * `buildManifest(input)` — pure function that composes a
 * {@link WebAppManifest} from the app's per-locale translations
 * table.
 *
 * The typical flow:
 *
 *   1. App owns the English base values (name, description,
 *      shortcuts) + a translations map (`{ ar: { name, short_name,
 *      shortcuts } }`).
 *   2. Consumer calls `buildManifest({ base, translations, icons,
 *      ... })` at build time.
 *   3. The function returns a plain object matching the W3C spec
 *      that either `vite-plugin-pwa` or Next.js `manifest.ts` can
 *      serialise.
 *
 * The function strips our internal `id` field from shortcuts before
 * emitting the manifest so the wire shape stays spec-compliant, but
 * uses `id` for translation lookups when the caller provides one.
 */

import type {
  ManifestIcon,
  ManifestShortcut,
  ManifestTranslation,
  WebAppManifest,
} from "./manifest.type";

/** Input the caller passes to {@link buildManifest}. */
export interface BuildManifestInput {
  /** Full product name (English source). */
  readonly name: string;
  /** Short name (English source). */
  readonly shortName: string;
  /** One-line description (English source). */
  readonly description: string;
  /** Primary language BCP-47 tag (`"en-US"` etc.). */
  readonly lang: string;
  /** Text direction. Default `"auto"`. */
  readonly dir?: "ltr" | "rtl" | "auto";
  /** Launcher start URL. Default `"/"`. */
  readonly startUrl?: string;
  /** Scope of URLs the installed app owns. Default `"/"`. */
  readonly scope?: string;
  /** Display mode. Default `"standalone"`. */
  readonly display?: WebAppManifest["display"];
  /** Fallback display modes. */
  readonly displayOverride?: readonly string[];
  /** Theme colour (browser chrome tint). */
  readonly themeColor: string;
  /** Splash background colour. */
  readonly backgroundColor: string;
  /** Icon set (usually the pwa-assets-generator output). */
  readonly icons: readonly ManifestIcon[];
  /** Home-screen shortcuts (English source). */
  readonly shortcuts?: readonly ManifestShortcut[];
  /**
   * Per-locale translations. Keyed by BCP-47 tag. Missing tags fall
   * back to the top-level fields (browser handles this).
   */
  readonly translations?: Readonly<Record<string, ManifestTranslation>>;
  /** Optional app-store category tags. */
  readonly categories?: readonly string[];
  /** Any extra fields the consumer's plugin supports. */
  readonly extra?: Record<string, unknown>;
}

/**
 * Drops the internal `id` field from each shortcut so the emitted
 * manifest stays spec-compliant. Returns a fresh array.
 */
function stripShortcutIds(shortcuts: readonly ManifestShortcut[]): ManifestShortcut[] {
  return shortcuts.map(({ id: _internalId, ...rest }) => rest);
}

/**
 * Composes a {@link WebAppManifest} from the caller's inputs. Pure —
 * no side effects, no runtime deps, safe to call from `vite.config.ts`
 * / `next.config.ts` at build time.
 */
export function buildManifest(input: BuildManifestInput): WebAppManifest {
  const {
    name,
    shortName,
    description,
    lang,
    dir = "auto",
    startUrl = "/",
    scope = "/",
    display = "standalone",
    displayOverride,
    themeColor,
    backgroundColor,
    icons,
    shortcuts,
    translations,
    categories,
    extra,
  } = input;

  const manifest: WebAppManifest = {
    name,
    short_name: shortName,
    description,
    lang,
    dir,
    start_url: startUrl,
    scope,
    display,
    ...(displayOverride ? { display_override: displayOverride } : {}),
    theme_color: themeColor,
    background_color: backgroundColor,
    icons,
    ...(shortcuts ? { shortcuts: stripShortcutIds(shortcuts) } : {}),
    ...(translations ? { translations } : {}),
    ...(categories ? { categories } : {}),
    ...extra,
  };

  return manifest;
}
