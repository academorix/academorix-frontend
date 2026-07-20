/**
 * @file share-target.interface.ts
 * @module @stackra/pwa/manifest/interfaces
 * @description Web Share Target API entry — makes the PWA a
 *   target in the OS share sheet.
 */

import type { IShareTargetParams } from './share-target-params.interface';

/**
 * The `share_target` manifest field.
 *
 * When declared, the PWA appears in the OS share sheet. The browser
 * POSTs (or GETs) the shared payload to `action` using the form-field
 * names declared in `params`.
 */
export interface IShareTarget {
  /** URL inside the PWA scope that receives the share. */
  readonly action: string;
  /** HTTP method. Chromium accepts `'GET'` and `'POST'`. */
  readonly method?: 'GET' | 'POST';
  /** Encoding — required for `POST` when `params.files` is set. */
  readonly enctype?: 'application/x-www-form-urlencoded' | 'multipart/form-data';
  /** Form-field mapping for the shared payload. */
  readonly params: IShareTargetParams;
}
