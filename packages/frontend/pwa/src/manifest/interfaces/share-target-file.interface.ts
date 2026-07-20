/**
 * @file share-target-file.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description A file-accepted-by-share-target entry — one item in
 *   `share_target.params.files`.
 */

/**
 * File accepted by the PWA's Share Target endpoint.
 *
 * `accept` may list MIME types (`'image/*'`) or file extensions
 * (`'.png'`), or both — the browser filters the OS share sheet
 * according to the list.
 */
export interface IShareTargetFile {
  /** Field name the file arrives under (`multipart/form-data`). */
  readonly name: string;
  /**
   * Single MIME/extension or a list of them. The browser matches any
   * file whose type / extension is in this list.
   */
  readonly accept: string | readonly string[];
}
