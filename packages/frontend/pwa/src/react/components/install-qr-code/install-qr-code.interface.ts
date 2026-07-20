/**
 * @file install-qr-code.interface.ts
 * @module @stackra/pwa/react/components
 * @description Props for the `<InstallQrCode>` component.
 */

/**
 * Props accepted by {@link InstallQrCode}.
 */
export interface InstallQrCodeProps {
  /**
   * URL encoded in the QR code — typically the app's `start_url` so
   * scanning the code from a mobile browser opens the installable
   * PWA.
   */
  readonly url: string;
  /**
   * QR code image size in CSS pixels (rendered on a `<canvas>` at
   * device pixel ratio × this value).
   *
   * @default 200
   */
  readonly size?: number;
  /**
   * Error correction level forwarded to `qrcode`. Higher levels
   * survive more logo overlay / paper damage.
   *
   * @default 'M'
   */
  readonly errorCorrection?: "L" | "M" | "Q" | "H";
  /** Additional CSS classes appended to the root. */
  readonly className?: string;
  /** Optional card title rendered above the QR code. */
  readonly title?: string;
  /** Optional card description rendered below the title. */
  readonly description?: string;
}
