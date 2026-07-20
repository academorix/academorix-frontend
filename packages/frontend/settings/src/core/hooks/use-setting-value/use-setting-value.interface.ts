/**
 * @file use-setting-value.interface.ts
 * @module @stackra/settings/core/hooks
 * @description Result shape returned by `useSettingValue`.
 */

/**
 * Reactive single-field result object.
 *
 * @typeParam T - The value type.
 */
export interface IUseSettingValueResult<T> {
  /** Current value of the referenced field. */
  readonly value: T;
  /** Update the field. */
  readonly setValue: (next: T) => void;
}
