/**
 * @file file-handler.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description File Handling API entry — makes the PWA a target for
 *   double-click / "Open with" on files matching a MIME type or file
 *   extension.
 */

import type { IManifestIcon } from './manifest-icon.interface';

/**
 * One entry in the `file_handlers` array.
 *
 * Chromium routes matching file opens to the PWA at `action`. The
 * launch behaviour (single vs. multi-window) is controlled by
 * `launch_type`.
 */
export interface IFileHandler {
  /** URL inside the PWA scope that receives the file open. */
  readonly action: string;
  /**
   * Map of MIME type → list of allowed file extensions. Example:
   * `{ 'image/png': ['.png'], 'text/plain': ['.txt', '.text'] }`.
   */
  readonly accept: Readonly<Record<string, readonly string[]>>;
  /** Optional icon set shown in the OS "Open with" dialogue. */
  readonly icons?: readonly IManifestIcon[];
  /**
   * `'single-client'` opens one PWA instance for every file batch;
   * `'multiple-clients'` opens one instance per file. Chromium
   * defaults to `'single-client'` when omitted.
   */
  readonly launch_type?: 'single-client' | 'multiple-clients';
}
