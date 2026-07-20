/**
 * @file optimistic-lock.error.ts
 * @module @stackra/dashboard/core/errors
 * @description Error thrown by the storage adapter when a client's
 *   `version` is stale. The frontend re-fetches, merges, and retries.
 */

/**
 * Thrown when {@link IDashboardStorageAdapter.update} receives a stale
 * `version`. Carries the client + server versions so the UI can surface
 * a "reload and try again" toast without a second round-trip.
 */
export class OptimisticLockError extends Error {
  /** The version the server had when the write attempted. */
  public readonly serverVersion: number;

  /** The version the client sent along with the update. */
  public readonly clientVersion: number;

  /**
   * @param clientVersion Version the client sent with the update.
   * @param serverVersion Version the server observed at write time.
   */
  public constructor(clientVersion: number, serverVersion: number) {
    super(
      `Dashboard version mismatch: client sent ${clientVersion}, server has ${serverVersion}. ` +
        `Refresh the dashboard and try again.`,
    );
    this.name = "OptimisticLockError";
    this.clientVersion = clientVersion;
    this.serverVersion = serverVersion;
  }
}
