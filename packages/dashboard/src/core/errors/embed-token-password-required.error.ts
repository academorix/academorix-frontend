/**
 * @file embed-token-password-required.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Error thrown by
 *   {@link IDashboardStorageAdapter.resolveEmbedToken} when the token
 *   carries a password gate and the caller either did not present a
 *   session key or presented one that does not match / has expired.
 */

/**
 * Thrown when a password-gated broadcast is queried without a valid
 * session key. The gate page catches this to prompt the viewer.
 */
export class EmbedTokenPasswordRequiredError extends Error {
  /** Construct with the canonical prompt message. */
  public constructor() {
    super("Broadcast requires a password.");
    this.name = "EmbedTokenPasswordRequiredError";
  }
}
