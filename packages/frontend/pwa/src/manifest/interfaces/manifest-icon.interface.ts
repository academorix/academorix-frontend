/**
 * @file manifest-icon.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description A single icon entry inside the Web App Manifest.
 */

/**
 * Icon entry inside the `icons` array of the Web App Manifest.
 *
 * Follows the W3C spec plus an optional `density` extension the
 * package emits when the caller provides it (matches the legacy
 * Magento manifest format still used in some Android WebView
 * shells).
 */
export interface IManifestIcon {
  /** Icon URL — relative or absolute. */
  readonly src: string;
  /** Space-separated size list (e.g. `'192x192'` or `'48x48 96x96'`). */
  readonly sizes: string;
  /** MIME type (e.g. `'image/png'`). */
  readonly type: string;
  /** `'any'`, `'maskable'`, or `'monochrome'` per W3C. */
  readonly purpose?: string;
  /**
   * Android density hint (`'0.75'`, `'1.0'`, ..., `'4.0'`). Emitted
   * verbatim when present — it's a non-standard extension recognised
   * by some legacy WebView launchers.
   */
  readonly density?: string;
}
