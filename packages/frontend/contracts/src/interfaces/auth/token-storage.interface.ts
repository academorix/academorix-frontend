/**
 * @file token-storage.interface.ts
 * @module @stackra/contracts/interfaces/auth
 * @description Pluggable token-storage adapter contract.
 *
 *   Implementations wrap the underlying platform primitive
 *   (`localStorage` on web, `SecureStore` on native). Auth ships two
 *   defaults — a `LocalStorageTokenAdapter` (web) and a
 *   `SecureStoreTokenAdapter` (native) — but any implementation of this
 *   contract can be bound to {@link TOKEN_STORAGE} to override where the
 *   auth token lives.
 */

/**
 * Token storage adapter contract.
 *
 * Each method may be sync or async — the token-storage abstraction is
 * intentionally permissive to accommodate both the synchronous web
 * `localStorage` API and the asynchronous React Native `SecureStore`.
 */
export interface ITokenStorage {
  /** Read the stored token, or `null` when none. */
  get(): string | null | Promise<string | null>;
  /** Persist `token`. */
  set(token: string): void | Promise<void>;
  /** Remove the persisted token. */
  clear(): void | Promise<void>;
}
