/**
 * @file locale-item.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description LocaleItem interface.
 */

/**
 * Locale item for display in the selector.
 */
export interface LocaleItem {
  /** Locale code (e.g., "en", "ar"). */
  code: string;
  /** Display name (e.g., "English", "العربية"). */
  name: string;
  /** Optional flag emoji or icon. */
  flag?: string;
}
