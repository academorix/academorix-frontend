/**
 * @file locale-storage.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Contract for platform-specific locale-persistence adapters.
 *
 *   - **Web**: `localStorage` (`WebStorageAdapter`).
 *   - **Native**: `AsyncStorage` (`AsyncStorageLocaleAdapter`).
 *   - **SSR**: no-op / unregistered.
 *
 *   All methods are async and expected to fail-open (never throw) so that
 *   locale operations continue even when persistence is unavailable.
 *
 *   Lives in contracts so custom storage backends (encrypted stores,
 *   cookie shims, cross-device sync layers) can be authored without a
 *   runtime dependency on `@stackra/i18n`.
 */

/**
 * Platform-specific locale-storage adapter contract.
 */
export interface ILocaleStorage {
  /** Retrieve the persisted locale, or `null` when none is stored. */
  getLocale(): Promise<string | null>;
  /** Persist a locale code. */
  setLocale(locale: string): Promise<void>;
  /** Remove any persisted locale. */
  clearLocale(): Promise<void>;
}
