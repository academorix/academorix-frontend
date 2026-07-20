/**
 * @file language-toggle-option.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description LanguageToggleOption interface.
 */

/**
 * Toggle option for a locale.
 */
export interface LanguageToggleOption {
  /** Locale code (e.g., "en"). */
  code: string;
  /** Short display label (e.g., "EN", "ع"). */
  label: string;
}
