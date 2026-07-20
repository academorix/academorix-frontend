/**
 * @file embed-token-invalid.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Error thrown by
 *   {@link IDashboardStorageAdapter.resolveEmbedToken} when the token
 *   is unknown, revoked, or expired. The public embed page maps this to
 *   an opaque 404 so viewers can't tell which case hit.
 */

/**
 * Thrown when a token fails validation. Never carries a reason — every
 * failure surface (unknown / revoked / expired / dashboard un-shared)
 * throws the same error to prevent enumeration.
 */
export class EmbedTokenInvalidError extends Error {
  /** Construct with the canonical opaque message. */
  public constructor() {
    super("Embed token is invalid, revoked, or expired.");
    this.name = "EmbedTokenInvalidError";
  }
}
