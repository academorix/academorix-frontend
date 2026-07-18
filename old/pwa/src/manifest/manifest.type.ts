/**
 * @file manifest.type.ts
 * @module @academorix/pwa/manifest/manifest.type
 *
 * @description
 * Structural types for the Web App Manifest — kept as our own
 * interfaces so this package doesn't depend on a specific bundler's
 * type export (`vite-plugin-pwa`'s `ManifestOptions`,
 * `next-manifest`'s shape, etc). Both integrations accept plain
 * JSON that matches the W3C spec.
 *
 * The types cover the fields Academorix actually uses; the full
 * W3C spec has more (e.g. `screenshots`, `share_target`) that we
 * can add here when a consumer wants them.
 */

/** A single icon entry inside the manifest `icons` array. */
export interface ManifestIcon {
  readonly src: string;
  readonly sizes: string;
  readonly type: string;
  /** `"any" | "maskable" | "monochrome"` per W3C. */
  readonly purpose?: string;
}

/** A single home-screen shortcut. */
export interface ManifestShortcut {
  /** Stable id — our own extension, used for translation lookups. */
  readonly id?: string;
  readonly name: string;
  readonly short_name?: string;
  readonly description?: string;
  readonly url: string;
  readonly icons?: readonly ManifestIcon[];
}

/**
 * Per-locale translated fields (W3C draft — Chromium 100+, Edge 100+,
 * Samsung Internet 16+, Android). Browsers that don't support
 * `translations` fall back to the top-level fields.
 */
export interface ManifestTranslation {
  readonly name?: string;
  readonly short_name?: string;
  readonly description?: string;
  /**
   * Shortcut translations keyed by the shortcut's `url` (the field
   * the W3C spec uses for lookup) OR by the app-specific `id` when
   * the caller passes an `idResolver`.
   */
  readonly shortcuts?: Readonly<Record<string, ManifestShortcut>>;
}

/**
 * The Web App Manifest shape produced by {@link buildManifest}. We
 * type it liberally (`Record<string, unknown>` allowed via
 * `[key: string]: unknown`) so callers can extend with fields the
 * consumer's plugin supports without a type cast.
 */
export interface WebAppManifest {
  /** Full app name shown in install prompts + splash screens. */
  readonly name: string;
  /** Short name (target ≤ 12 chars per HIG). */
  readonly short_name: string;
  /** One-line description. */
  readonly description: string;

  /** Primary language BCP-47 tag. */
  readonly lang: string;
  /** Text direction — `"ltr" | "rtl" | "auto"`. */
  readonly dir: "ltr" | "rtl" | "auto";

  /** Launcher start URL. */
  readonly start_url: string;
  /** Scope of URLs the installed app owns. */
  readonly scope: string;

  /** Display mode — `"standalone" | "fullscreen" | "minimal-ui" | "browser"`. */
  readonly display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  /**
   * Fallback display modes tried in order when `display` isn't
   * supported. Preferred over the legacy `display` field alone by
   * Chromium 93+.
   */
  readonly display_override?: readonly string[];

  /** Theme + splash background colours. */
  readonly theme_color: string;
  readonly background_color: string;

  /** Icon set — pass everything the pwa-assets-generator emits. */
  readonly icons: readonly ManifestIcon[];

  /** Home-screen shortcuts. */
  readonly shortcuts?: readonly ManifestShortcut[];

  /**
   * Per-locale translations. Keyed by BCP-47 tag
   * (`"ar-EG" | "en-US" | ...`).
   */
  readonly translations?: Readonly<Record<string, ManifestTranslation>>;

  /**
   * Categories advertised to the app store. Chromium 96+ uses the
   * value for its install prompt taxonomy.
   */
  readonly categories?: readonly string[];

  /** Free-form extensions — plugin-specific fields land here. */
  readonly [key: string]: unknown;
}
