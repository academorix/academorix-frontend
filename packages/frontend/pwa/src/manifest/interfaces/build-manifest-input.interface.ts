/**
 * @file build-manifest-input.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Input shape accepted by `buildManifest`.
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
import type { ManifestDisplayMode } from './web-app-manifest.interface';
import type { IWidget } from './widget.interface';

/**
 * Input to `buildManifest(input)`.
 *
 * The builder is pure — no side effects, no runtime dependencies —
 * so it's safe to call from `vite.config.ts` at build time or from
 * a Node script that emits `manifest.webmanifest`.
 *
 * Only `name`, `themeColor`, `backgroundColor`, `icons`, and `lang`
 * are structurally required by the caller — every other field is
 * optional and only emitted when supplied. Unknown extension fields
 * pass through via `extra`.
 */
export interface IBuildManifestInput {
  // ── Identity ────────────────────────────────────────────────────
  /** Full product name (English source). */
  readonly name: string;
  /** Short name (English source). */
  readonly shortName?: string;
  /** One-line description (English source). */
  readonly description?: string;
  /** Non-standard `version` — passed through when supplied. */
  readonly version?: string;
  /** Non-standard `author` — passed through when supplied. */
  readonly author?: string;

  // ── Localization ────────────────────────────────────────────────
  /** Primary language BCP-47 tag (`'en-US'` etc.). */
  readonly lang: string;
  /** Text direction. @default 'auto' */
  readonly dir?: 'ltr' | 'rtl' | 'auto';
  /** Per-locale translations. Keyed by BCP-47 tag. */
  readonly translations?: Readonly<Record<string, IManifestTranslation>>;

  // ── Navigation ──────────────────────────────────────────────────
  /** Launcher start URL. @default '/' */
  readonly startUrl?: string;
  /** Scope of URLs the installed app owns. @default '/' */
  readonly scope?: string;
  /** Manifest identity URL (`id`). Recommended by W3C. */
  readonly id?: string;

  // ── Display ─────────────────────────────────────────────────────
  /** Display mode. @default 'standalone' */
  readonly display?: ManifestDisplayMode;
  /** Fallback display modes tried in order. */
  readonly displayOverride?: readonly (
    'window-controls-overlay' | 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser'
  )[];
  /**
   * Orientation preference. Emitted verbatim when present.
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
  readonly themeColor: string;
  /** Splash background colour. */
  readonly backgroundColor: string;

  // ── Appearance ──────────────────────────────────────────────────
  /** Icon set (usually the pwa-assets-generator output). */
  readonly icons: readonly IManifestIcon[];
  /** Home-screen shortcuts (English source). */
  readonly shortcuts?: readonly IManifestShortcut[];
  /** App-store screenshots. */
  readonly screenshots?: readonly IManifestScreenshot[];
  /** App-store category tags. */
  readonly categories?: readonly string[];
  /** Free-text keywords the store's search indexes. */
  readonly keywords?: readonly string[];

  // ── Installation ────────────────────────────────────────────────
  readonly preferRelatedApplications?: boolean;
  readonly relatedApplications?: readonly IRelatedApplication[];
  readonly launchHandler?: ILaunchHandler;
  readonly edgeSidePanel?: { readonly preferred_width?: number };

  // ── File / Protocol / URL / Share Target ────────────────────────
  readonly fileHandlers?: readonly IFileHandler[];
  readonly protocolHandlers?: readonly IProtocolHandler[];
  readonly urlHandlers?: readonly IUrlHandler[];
  readonly shareTarget?: IShareTarget;

  // ── Note Taking + Widgets + Tab Strip ───────────────────────────
  readonly noteTaking?: { readonly new_note_url: string };
  readonly widgets?: readonly IWidget[];
  readonly tabStrip?: {
    readonly home_tab?: {
      readonly icons?: readonly IManifestIcon[];
      readonly scope_patterns?: readonly string[];
    };
  };

  // ── Experimental / Chromium-specific ────────────────────────────
  readonly permissions?: readonly string[];
  readonly captureLinks?: 'none' | 'new-client' | 'existing-client';
  readonly handleLinks?: 'auto' | 'preferred';
  readonly scopeExtensions?: readonly string[];
  readonly launchQueue?: unknown;

  // ── Free-form extensions ────────────────────────────────────────
  /** Any extra fields the caller's plugin supports. */
  readonly extra?: Record<string, unknown>;
}
