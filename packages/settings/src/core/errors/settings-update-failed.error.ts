/**
 * @file settings-update-failed.error.ts
 * @module @stackra/settings/core/errors
 * @description Thrown when a settings-update request could not be
 *   persisted after the configured retry policy has been exhausted.
 */

import { SettingsError } from './settings.error';

/**
 * Thrown when an update request cannot be persisted to the underlying
 * store. Fires after `retry(fn, options)` has exhausted its attempts.
 *
 * The error carries the group key + affected field keys so callers
 * (or the React optimistic-update roll-back path) can pinpoint what
 * failed.
 */
export class SettingsUpdateFailedError extends SettingsError {
  /** Group key whose update failed. */
  public readonly groupKey: string;

  /** Field keys that were part of the failed update batch. */
  public readonly fieldKeys: readonly string[];

  /**
   * Create a new update-failed error.
   *
   * @param groupKey - Group key whose update failed.
   * @param fieldKeys - Field keys included in the failed batch.
   * @param cause - Underlying error (HTTP failure, storage quota, …).
   */
  public constructor(groupKey: string, fieldKeys: readonly string[], cause?: unknown) {
    const fieldsPreview = fieldKeys.slice(0, 5).join(', ');
    const suffix = fieldKeys.length > 5 ? `, +${fieldKeys.length - 5} more` : '';
    super(
      `Failed to update settings group "${groupKey}" ` + `(fields: ${fieldsPreview}${suffix}).`,
      cause
    );
    this.name = 'SettingsUpdateFailedError';
    this.groupKey = groupKey;
    this.fieldKeys = fieldKeys;
  }
}
