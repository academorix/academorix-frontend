/**
 * @file web-app-manifest.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description The Web App Manifest shape emitted by `buildManifest`.
 *
 *   Covers every field defined by the W3C Web App Manifest spec plus
 *   the Chromium-specific extensions (Launch Handler, File Handling,
 *   Protocol Handling, URL Handling, Share Target, Widgets, Tab
 *   Strip, Note Taking, Edge Side Panel). Every field is optional
 *   except `name`, so additive changes never break existing
 *   consumers.
 *
 *   Free-form fields are accepted at the `[key: string]: unknown`
 *   tail so callers can extend with plugin-specific properties
 *   without a cast at the call site.
 */

import type { IFileHandler } from './file-handler.interface';
import type { ILaunchHandler } from './launch-handler.interface';
import type { IManifestIcon } from './manifest-icon.interface';
import type { IManifestScreenshot } from './manifest-screenshot.interface';
import type { IManifestShortcut } from './manifest-shortcut.interface';
import type { IManifestTranslation } from './manifest-translation.interface';
import type { IProtocolHandler } from './protocol-handler.interface';
import type { IRelatedApplication } from './related-application.interface';
import type { IShareTarget } from './share-target.interface';
import type { IUrlHandler } from './url-handler.interface';
import type { IWidget } from './widget.interface';

/**
 * Discriminated display-mode string used by the manifest.
 *
 * Kept as a re-exported alias to the manifest's `display` field so
 * older consumers who imported `ManifestDisplayMode` continue to
 * compile.
 */
export type ManifestDisplayMode =
  'standalone' | 'fullscreen' | 'minimal-ui' | 'browser' | 'window-controls-overlay';

/**
 * W3C-compliant Web App Manifest.
 *
 * Field ordering below follows W3C's own reference so scanning the
 * type matches the spec table. Chromium-specific extensions come
 * after the standard fields; free-form additions land at the tail
 * `[key: string]: unknown` so a caller's plugin-specific fields
 * (e.g. `dir`, `iarc_rating_id`) compile without a cast.
 */
export interface IWebAppManifest {
  // ── Identity ────────────────────────────────────────────────────
  /** Full app name shown in install prompts + splash screens. */
  readonly name: string;
  /** Short name (target ≤ 12 chars per HIG). */
  readonly short_name?: string;
  /** One-line description. */
  readonly description?: string;
  /** Non-standard `version` — some legacy shells respect it. */
  readonly version?: string;
  /** Non-standard `author` — same. */
  readonly author?: string;

  // ── Localization ────────────────────────────────────────────────
  /** Primary language BCP-47 tag. */
  readonly lang?: string;
  /** Text direction. */
  readonly dir?: 'ltr' | 'rtl' | 'auto';
  /** Per-locale translations, keyed by BCP-47 tag. */
  readonly translations?: Readonly<Record<string, IManifestTranslation>>;

  // ── Navigation ──────────────────────────────────────────────────
  /** Launcher start URL. */
  readonly start_url?: string;
  /** Scope of URLs the installed app owns. */
  readonly scope?: string;
  /**
   * Manifest identity URL — recommended so browsers can distinguish
   * an update from a fresh install when `start_url` changes.
   */
  readonly id?: string;

  // ── Display ─────────────────────────────────────────────────────
  /** Display mode. */
  readonly display?:
    'fullscreen' | 'standalone' | 'minimal-ui' | 'browser' | 'window-controls-overlay';
  /**
   * Preferred fallback display modes tried in order when `display`
   * isn't supported. Chromium 93+ reads this before `display`.
   */
  readonly display_override?: readonly (
    'window-controls-overlay' | 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  )[];
  /**
   * Orientation preference. Preserved from the legacy Magento
   * manifest, which pins the app to portrait for phones.
   */
  readonly orientation?:
    | 'any'
    | 'natural'
    | 'landscape'
    | 'landscape-primary'
    | 'landscape-secondary'
    | 'portrait'
    | 'portrait-primary'
    | 'portrait-secondary';

  // ── Colors ──────────────────────────────────────────────────────
  /** Theme colour (browser chrome tint). */
  readonly theme_color?: string;
  /** Splash background colour. */
  readonly background_color?: string;

  // ── Appearance ──────────────────────────────────────────────────
  /** Icon set — usually the pwa-assets-generator output. */
  readonly icons?: readonly IManifestIcon[];
  /** App-store screenshots (Chromium install prompt carousel). */
  readonly screenshots?: readonly IManifestScreenshot[];
  /** Home-screen shortcuts. */
  readonly shortcuts?: readonly IManifestShortcut[];
  /** App-store category tags. */
  readonly categories?: readonly string[];
  /** Free-text keywords the store's search indexes. */
  readonly keywords?: readonly string[];

  // ── Installation ────────────────────────────────────────────────
  /**
   * When `true`, the browser prefers a native app declared in
   * `related_applications` over the PWA install prompt.
   */
  readonly prefer_related_applications?: boolean;
  /** Related apps the browser considers as install alternatives. */
  readonly related_applications?: readonly IRelatedApplication[];
  /** Launch Handler API — reuse-or-navigate semantics. */
  readonly launch_handler?: ILaunchHandler;
  /**
   * Edge Side Panel — preferred width when the PWA runs inside
   * Edge's side-panel surface.
   */
  readonly edge_side_panel?: { readonly preferred_width?: number };

  // ── File Handling API ───────────────────────────────────────────
  readonly file_handlers?: readonly IFileHandler[];

  // ── Protocol Handling API ───────────────────────────────────────
  readonly protocol_handlers?: readonly IProtocolHandler[];

  // ── URL Handling API (deprecated in favour of scope_extensions) ─
  readonly url_handlers?: readonly IUrlHandler[];

  // ── Share Target API ────────────────────────────────────────────
  readonly share_target?: IShareTarget;

  // ── Note Taking API ─────────────────────────────────────────────
  readonly note_taking?: { readonly new_note_url: string };

  // ── Widgets API ─────────────────────────────────────────────────
  readonly widgets?: readonly IWidget[];

  // ── Tab Strip / Window Controls ─────────────────────────────────
  readonly tab_strip?: {
    readonly home_tab?: {
      readonly icons?: readonly IManifestIcon[];
      readonly scope_patterns?: readonly string[];
    };
  };

  // ── Experimental / Chromium-specific ────────────────────────────
  /** Requested Permissions Policy directives. */
  readonly permissions?: readonly string[];
  /** Link-capture behaviour. */
  readonly capture_links?: 'none' | 'new-client' | 'existing-client';
  /** Link-handling preference. */
  readonly handle_links?: 'auto' | 'preferred';
  /**
   * Additional origins/patterns the installed app's scope extends
   * over — successor to `url_handlers`.
   */
  readonly scope_extensions?: readonly string[];
  /** Launch Queue API opaque payload. */
  readonly launch_queue?: unknown;

  // ── Free-form extensions ────────────────────────────────────────
  /** Any extra fields the caller's plugin supports. */
  readonly [key: string]: unknown;
}
