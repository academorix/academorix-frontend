/**
 * @file translate-options.interface.ts
 * @module @stackra/contracts/interfaces/i18n
 * @description Options accepted by `II18nManager.translate()` / `.t()`.
 *
 *   Lives in contracts because it's part of the manager's public contract
 *   — cross-package consumers that inject `I18N_MANAGER` pass these
 *   options and must type against them.
 */

/**
 * Options for a single translation call.
 */
export interface TranslateOptions {
  /** Override the locale for this call only. */
  lang?: string;

  /** Interpolation arguments — key/value map or an array of them. */
  args?: Record<string, unknown> | Array<Record<string, unknown> | string>;

  /** Fallback string when the key is not found. */
  defaultValue?: string;

  /** Return nested objects / arrays instead of stringifying. */
  returnObjects?: boolean;

  /** Join array translations with this delimiter. */
  joinArrays?: string;

  /** Override the key separator for this call. */
  keySeparator?: string | false;

  /** Override the namespace separator for this call. */
  nsSeparator?: string | false;

  /** Enable debug mode — returns the key itself. */
  debug?: boolean;

  /** Count used for pluralization. */
  count?: number;
}
