/**
 * @file unlock-embed-token-input.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Payload the viewer submits to
 *   {@link IDashboardStorageAdapter.unlockEmbedToken}.
 */

/**
 * Password submitted by the viewer to unlock a gated broadcast.
 */
export interface IUnlockEmbedTokenInput {
  /**
   * Raw password the viewer typed into the gate page. The adapter
   * hashes it and compares against the persisted digest.
   */
  password: string;
}
