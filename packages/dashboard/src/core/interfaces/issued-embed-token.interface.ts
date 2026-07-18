/**
 * @file issued-embed-token.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description The freshly-minted token payload returned by
 *   {@link IDashboardStorageAdapter.issueEmbedToken}. The raw token
 *   round-trips exactly once — subsequent reads never surface it again.
 */

import type { IEmbedTokenRecord } from "./embed-token-record.interface";

/**
 * Freshly-issued embed token. Returned once by the issue call. The
 * `rawToken` is never persisted (only its digest is in production).
 */
export interface IIssuedEmbedToken extends IEmbedTokenRecord {
  /** Raw opaque token. Returned only from `issueEmbedToken`. */
  rawToken: string;

  /**
   * Full URL the user can copy — origin + broadcast route + token.
   * Freshly-minted links land on `/broadcast/:token`, the gate-aware
   * route.
   */
  embedUrl: string;
}
