/**
 * @file scope-persist-adapter.interface.ts
 * @module @stackra/scope/core/interfaces
 * @description Persistence contract for surviving the active scope across
 *   app restarts. Implemented per-platform: `AsyncStorageScopePersistAdapter`
 *   on React Native, a `localStorage`-backed adapter on web (both live
 *   outside of `core`; the interface here is the shared shape).
 *
 *   The adapter stores the opaque node id only — a scalar string. Full
 *   `IScopeContext` resolution stays server-side; on next launch the app
 *   restores the id, calls `dataSource.resolveScope(id)`, and passes the
 *   result as `initialScope`.
 */

/**
 * Persistence adapter for the active scope node id.
 *
 * Implementations MUST be fail-soft: a missing / corrupt / unavailable
 * store returns `null` from `restore()` and swallows write errors from
 * `persist()` / `clear()`. The runtime keeps working without persistence.
 */
export interface IScopePersistAdapter {
  /**
   * Persist the active node id. May be async on stores whose write is
   * async (AsyncStorage, IndexedDB); synchronous on `localStorage`.
   * Errors are swallowed by the implementation.
   */
  persist(nodeId: string): void | Promise<void>;

  /**
   * Restore the previously persisted node id, or `null` when nothing is
   * stored / the store isn't available. Always async so implementations
   * can go through async stores; sync stores can `Promise.resolve(...)`.
   */
  restore(): Promise<string | null>;

  /** Remove the persisted node id. Fail-soft. */
  clear(): void | Promise<void>;
}
