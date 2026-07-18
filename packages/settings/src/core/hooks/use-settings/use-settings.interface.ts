/**
 * @file use-settings.interface.ts
 * @module @stackra/settings/core/hooks
 * @description Result shape returned by the `useSettings` hook.
 */

/**
 * Reactive result object returned by `useSettings`.
 *
 * @typeParam T - Values shape (the DTO type when a DTO was passed;
 *   a `Record<string, unknown>` when a group key was passed).
 */
export interface IUseSettingsResult<T> {
  /** The current values for the group (merged with defaults). */
  readonly values: T;
  /** Update a single field. */
  readonly set: (key: keyof T & string, value: unknown) => void;
  /** Update multiple fields at once. */
  readonly setMany: (partial: Partial<T>) => void;
  /** Reset the group to its declared defaults. */
  readonly reset: () => void;
}
