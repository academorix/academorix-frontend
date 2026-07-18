/**
 * @file native-locale-item.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description NativeLocaleItem interface.
 */

/** Locale item for display in the native selector. */
export interface NativeLocaleItem {
  /** Locale code (e.g., "en", "ar"). */
  code: string;
  /** Display name (e.g., "English", "العربية"). */
  name: string;
  /** Optional flag emoji. */
  flag?: string;
}
