/**
 * @file use-http-result.interface.ts
 * @module @stackra/http/src/interfaces
 * @description IUseHttpResult interface.
 */

import type { IHttpClient } from '@stackra/contracts';

/**
 * Result of {@link useHttp}.
 */
export interface IUseHttpResult {
  /** Resolved client (`null` until ready). */
  client: IHttpClient | null;
  /** Whether resolution finished. */
  ready: boolean;
  /** Resolution error, if any. */
  error: Error | null;
}
