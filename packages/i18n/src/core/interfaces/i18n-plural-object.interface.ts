/**
 * @file i18n-plural-object.interface.ts
 * @module @stackra/i18n/core/interfaces
 * @description Interface for CLDR-based plural form objects used in translations.
 */

/**
 * Translation value with CLDR plural forms.
 *
 * @example
 * ```json
 * {
 *   "zero": "No items",
 *   "one": "{{count}} item",
 *   "two": "{{count}} items",
 *   "few": "{{count}} items",
 *   "many": "{{count}} items",
 *   "other": "{{count}} items"
 * }
 * ```
 */
export interface I18nPluralObject {
  /** Used when count is exactly 0 (optional, falls back to CLDR rule). */
  zero?: string;
  /** Used for singular (e.g., English count === 1). */
  one?: string;
  /** Used for dual (e.g., Arabic count === 2). */
  two?: string;
  /** Used for "few" category (e.g., Arabic 3-10). */
  few?: string;
  /** Used for "many" category (e.g., Arabic 11-99). */
  many?: string;
  /** Default fallback for all other counts. */
  other?: string;
}
