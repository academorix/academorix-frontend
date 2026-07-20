/**
 * @file url-handler.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description URL Handling API entry — declares that the PWA
 *   should be the default handler for URLs on a matching origin.
 *
 *   Deprecated in favour of `scope_extensions` on newer Chromium
 *   versions but still emitted when the caller supplies it.
 */

/**
 * One entry in the `url_handlers` array.
 */
export interface IUrlHandler {
  /**
   * Origin the PWA claims — e.g. `'https://example.com'`. The
   * browser verifies the association via a signed `web-app-origin-association`
   * file on the origin.
   */
  readonly origin: string;
}
