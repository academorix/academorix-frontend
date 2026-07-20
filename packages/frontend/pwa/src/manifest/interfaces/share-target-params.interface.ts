/**
 * @file share-target-params.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description The `params` section of a Share Target manifest entry
 *   — declares the form field names for the shared title, text, url,
 *   and any attached files.
 */

import type { IShareTargetFile } from "./share-target-file.interface";

/**
 * Names of the form fields the PWA expects the browser to POST when
 * the OS share sheet routes a share to it.
 *
 * Every field is optional — the caller declares only the ones their
 * `action` endpoint reads.
 */
export interface IShareTargetParams {
  /** Field name receiving the shared title (default `'title'`). */
  readonly title?: string;
  /** Field name receiving the shared text. */
  readonly text?: string;
  /** Field name receiving the shared URL. */
  readonly url?: string;
  /**
   * Files accepted by the share target. When present, the browser
   * POSTs the request as `multipart/form-data`.
   */
  readonly files?: readonly IShareTargetFile[];
}
