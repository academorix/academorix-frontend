/**
 * @file manifest-screenshot.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description A single app-store screenshot entry.
 */

/**
 * Screenshot entry declared in the manifest.
 *
 * Chromium's install prompt renders these in a carousel — the
 * `form_factor` field decides which screenshots surface for phone
 * versus desktop layouts.
 */
export interface IManifestScreenshot {
  /** Screenshot URL — relative or absolute. */
  readonly src: string;
  /** Size in `WxH` pixels (e.g. `'1080x1920'`). */
  readonly sizes: string;
  /** MIME type (e.g. `'image/png'`). */
  readonly type: string;
  /**
   * Target form factor. Chromium recognises `'narrow'` (phones) and
   * `'wide'` (desktop / tablet). Missing = any.
   */
  readonly form_factor?: "narrow" | "wide";
  /** Human-readable label rendered as the screenshot caption. */
  readonly label?: string;
  /** Purpose per W3C — `'any'` or `'maskable'`. */
  readonly platform?: string;
}
