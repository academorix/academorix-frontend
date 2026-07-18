/**
 * @file consent-category.interface.ts
 * @module @stackra/contracts/interfaces/consent
 * @description Consent category definition.
 */

/**
 * A localizable label — either a plain string or a locale-keyed map.
 *
 * Kept inline (rather than importing from a page-builder namespace) so the
 * consent contract has no upstream dependency on a UI-building system.
 */
export type ITranslatableLabel = string | Readonly<Record<string, string>>;

/**
 * A consent category definition.
 *
 * Each category groups a set of purposes (analytics, marketing, ...) and
 * specifies whether it's mandatory and what its default state is.
 */
export interface IConsentCategory {
  /** Unique slug identifier (e.g. `'analytics'`, `'marketing'`). */
  slug: string;

  /** Human-readable label for UI display. */
  label: ITranslatableLabel;

  /** Extended description explaining what the category covers. */
  description: ITranslatableLabel;

  /** If `true`, the category is always granted and cannot be revoked. */
  required: boolean;

  /** Default consent state before the user makes a decision. */
  default: boolean;
}
