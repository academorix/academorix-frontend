/**
 * @file setting-field-option.interface.ts
 * @module @stackra/contracts/interfaces/settings
 * @description Option shape for select / multiselect / radio / segment
 *   setting fields.
 */

/**
 * A single choice presented by a `select` / `multiselect` / `radio` /
 * `segment` field.
 *
 * `value` is stored as-is; `label` renders in the picker. Plain strings
 * are common for enum-style choices; `labelKey` may be used by the
 * React layer to resolve an i18n message.
 */
export interface ISettingFieldOption {
  /** The stored value written back to the settings store. */
  readonly value: string | number | boolean;

  /**
   * The display label. Can be a plain string or an i18n key — the UI
   * renderer decides based on presence of an i18n provider.
   */
  readonly label: string;

  /**
   * Optional hint text rendered below or beside the option.
   */
  readonly description?: string;

  /**
   * Icon identifier resolved to a component by the React renderer
   * (via `@stackra/ui/icons/*` or an app-provided registry). Never
   * a `ComponentType` reference here — `core/` interfaces stay
   * React-free.
   */
  readonly icon?: string;

  /** When true, the option is visible but not selectable. */
  readonly disabled?: boolean;
}
