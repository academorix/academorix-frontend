/**
 * @file consent-storage-adapter.interface.ts
 * @module @stackra/contracts/interfaces/consent
 * @description Storage adapter contract for persisting consent preferences.
 */

/**
 * Platform-specific persistence layer for consent preferences.
 *
 * Implementations:
 * - `LocalStorageConsentAdapter` (web)
 * - `AsyncStorageConsentAdapter` (native)
 * - `CookieConsentAdapter` (SSR)
 * - `MemoryConsentAdapter` (testing)
 */
export interface IConsentStorageAdapter {
  /**
   * Load persisted consent preferences.
   *
   * @returns The stored preferences map, or `null` if none exist.
   */
  load(): Promise<Record<string, boolean> | null>;

  /**
   * Persist consent preferences.
   *
   * @param prefs - The preferences map to store.
   */
  save(prefs: Record<string, boolean>): Promise<void>;

  /** Clear every persisted consent data. */
  clear(): Promise<void>;
}
