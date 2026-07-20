/**
 * @file protocol-handler.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Protocol Handling API entry — registers the PWA as a
 *   handler for a custom `web+scheme` URL scheme.
 */

/**
 * One entry in the `protocol_handlers` array.
 *
 * The URL template uses `%s` as the placeholder for the encoded
 * protocol payload; e.g. `{ protocol: 'web+stackra', url: '/open?u=%s' }`.
 */
export interface IProtocolHandler {
  /**
   * The protocol scheme. Custom schemes MUST start with `web+`, and
   * safe-listed schemes (`mailto`, `sms`, `tel`, ...) may be
   * registered as-is.
   */
  readonly protocol: string;
  /** URL template inside the PWA scope; `%s` is the placeholder. */
  readonly url: string;
}
