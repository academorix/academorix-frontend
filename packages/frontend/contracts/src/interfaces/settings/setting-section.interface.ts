/**
 * @file setting-section.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Visual divider section preceding one field.
 *
 *   Applied via `@Section()` on a property. Fields carry the section's
 *   `label` in their `section` property; the React renderer emits a
 *   heading + optional description above the field.
 */

/** A visual divider section applied before a specific field. */
export interface ISettingSection {
  /** Display label (plain string or i18n key). */
  readonly label: string;

  /** Optional description below the label. */
  readonly description?: string;
}
