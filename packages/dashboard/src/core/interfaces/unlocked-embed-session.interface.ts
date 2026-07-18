/**
 * @file unlocked-embed-session.interface.ts
 * @module @stackra/dashboard/core/interfaces
 * @description Handshake returned by
 *   {@link IDashboardStorageAdapter.unlockEmbedToken} on success.
 */

/**
 * Session key issued after a successful broadcast unlock. The gate
 * page stashes the `sessionKey` in sessionStorage and passes it to
 * subsequent `resolveEmbedToken` calls to skip the gate for the TTL
 * window.
 */
export interface IUnlockedEmbedSession {
  /** Opaque handle proving the viewer is unlocked. */
  sessionKey: string;

  /** ISO-8601 timestamp when the session key expires. */
  expiresAt: string;
}
