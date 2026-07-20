/**
 * @file missing-keys-report.interface.ts
 * @module @stackra/i18n/src/interfaces
 * @description MissingKeysReport interface.
 */

/**
 * Report of missing keys per locale.
 */
export interface MissingKeysReport {
  /** Locale code. */
  locale: string;
  /** Keys present in the source locale but missing in this locale. */
  missingKeys: string[];
  /** Total missing count. */
  count: number;
}
