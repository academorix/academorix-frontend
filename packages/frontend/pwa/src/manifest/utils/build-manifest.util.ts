/**
 * @file build-manifest.util.ts
 * @module @stackra/pwa/manifest/utils
 * @description Pure Web App Manifest builder.
 *
 *   Composes an {@link IWebAppManifest} from the app's inputs — every
 *   W3C-standard field plus the Chromium-specific extensions
 *   (Launch Handler, File / Protocol / URL Handling, Share Target,
 *   Widgets, Tab Strip, Note Taking, Edge Side Panel). Strips the
 *   internal `id` field from shortcuts before emit so the wire shape
 *   stays spec-compliant.
 *
 *   Pure and dependency-free — safe to call from `vite.config.ts` or
 *   a Node script generating the manifest at build time.
 */

import type { IBuildManifestInput, IManifestShortcut, IWebAppManifest } from '../interfaces';

/**
 * Strip the caller's internal `id` field from every shortcut. Fresh
 * array so the caller's input isn't mutated.
 */
function stripShortcutIds(shortcuts: readonly IManifestShortcut[]): IManifestShortcut[] {
  return shortcuts.map(({ id: _internalId, ...rest }) => rest);
}

/**
 * Compose a Web App Manifest from the caller's inputs.
 *
 * @param input - Every source field the manifest is built from.
 * @returns A W3C-compliant Web App Manifest object.
 *
 * @example
 * ```typescript
 * import { buildManifest } from '@stackra/pwa/manifest';
 *
 * const manifest = buildManifest({
 *   name: 'Stackra',
 *   shortName: 'Stackra',
 *   description: 'The operating system for modern teams.',
 *   lang: 'en-US',
 *   themeColor: '#0EA5E9',
 *   backgroundColor: '#FFFFFF',
 *   icons: [{ src: '/pwa-192.png', sizes: '192x192', type: 'image/png' }],
 *   translations: { 'ar-EG': { name: '…', short_name: '…' } },
 * });
 * ```
 */
export function buildManifest(input: IBuildManifestInput): IWebAppManifest {
  const {
    name,
    shortName,
    description,
    version,
    author,
    lang,
    dir = 'auto',
    translations,
    startUrl = '/',
    scope = '/',
    id,
    display = 'standalone',
    displayOverride,
    orientation,
    themeColor,
    backgroundColor,
    icons,
    shortcuts,
    screenshots,
    categories,
    keywords,
    preferRelatedApplications,
    relatedApplications,
    launchHandler,
    edgeSidePanel,
    fileHandlers,
    protocolHandlers,
    urlHandlers,
    shareTarget,
    noteTaking,
    widgets,
    tabStrip,
    permissions,
    captureLinks,
    handleLinks,
    scopeExtensions,
    launchQueue,
    extra,
  } = input;

  // Compose the base spec-required fields first. Optional fields are
  // spread conditionally so they only surface on the manifest when the
  // caller provided them — matching W3C's "omitted vs. empty"
  // semantics. Order roughly follows the interface so scanning the
  // output matches the type.
  const manifest: IWebAppManifest = {
    // ── Identity ──────────────────────────────────────────────
    name,
    ...(shortName ? { short_name: shortName } : {}),
    ...(description ? { description } : {}),
    ...(version ? { version } : {}),
    ...(author ? { author } : {}),

    // ── Localization ──────────────────────────────────────────
    lang,
    dir,
    ...(translations ? { translations } : {}),

    // ── Navigation ────────────────────────────────────────────
    start_url: startUrl,
    scope,
    ...(id ? { id } : {}),

    // ── Display ───────────────────────────────────────────────
    display,
    ...(displayOverride ? { display_override: displayOverride } : {}),
    ...(orientation ? { orientation } : {}),

    // ── Colors ────────────────────────────────────────────────
    theme_color: themeColor,
    background_color: backgroundColor,

    // ── Appearance ────────────────────────────────────────────
    icons,
    ...(shortcuts ? { shortcuts: stripShortcutIds(shortcuts) } : {}),
    ...(screenshots ? { screenshots } : {}),
    ...(categories ? { categories } : {}),
    ...(keywords ? { keywords } : {}),

    // ── Installation ──────────────────────────────────────────
    ...(preferRelatedApplications != null
      ? { prefer_related_applications: preferRelatedApplications }
      : {}),
    ...(relatedApplications ? { related_applications: relatedApplications } : {}),
    ...(launchHandler ? { launch_handler: launchHandler } : {}),
    ...(edgeSidePanel ? { edge_side_panel: edgeSidePanel } : {}),

    // ── File / Protocol / URL / Share Target ──────────────────
    ...(fileHandlers ? { file_handlers: fileHandlers } : {}),
    ...(protocolHandlers ? { protocol_handlers: protocolHandlers } : {}),
    ...(urlHandlers ? { url_handlers: urlHandlers } : {}),
    ...(shareTarget ? { share_target: shareTarget } : {}),

    // ── Note Taking + Widgets + Tab Strip ─────────────────────
    ...(noteTaking ? { note_taking: noteTaking } : {}),
    ...(widgets ? { widgets } : {}),
    ...(tabStrip ? { tab_strip: tabStrip } : {}),

    // ── Experimental / Chromium-specific ──────────────────────
    ...(permissions ? { permissions } : {}),
    ...(captureLinks ? { capture_links: captureLinks } : {}),
    ...(handleLinks ? { handle_links: handleLinks } : {}),
    ...(scopeExtensions ? { scope_extensions: scopeExtensions } : {}),
    ...(launchQueue !== undefined ? { launch_queue: launchQueue } : {}),

    // ── Free-form extensions (caller's plugin fields) ─────────
    ...extra,
  };

  return manifest;
}
